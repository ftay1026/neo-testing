// src/app/api/memories/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: memories, error } = await supabase
      .from('memories')
      .select(`
        id,
        title,
        content,
        category,
        created_at,
        updated_at,
        chat_id,
        chats!inner(title)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memories:', error);
      return new Response('Error fetching memories', { status: 500 });
    }

    return Response.json(memories || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

// Helper function for embeddings (shared across files)
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    });
    
    const result = await response.json();
    if (!result.data?.[0]?.embedding) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    const vector: number[] = result.data[0].embedding;
    const magnitude = Math.sqrt(vector.reduce((sum: number, val: number) => sum + val * val, 0));
    return vector.map((val: number) => val / magnitude);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Array(1536).fill(0);
  }
}

function chunkText(text: string, maxChunkSize = 500, overlapRatio = 0.2) {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;
    
    if (endIndex < text.length) {
      const nextPeriod = text.indexOf('.', endIndex);
      if (nextPeriod !== -1 && nextPeriod - endIndex < 100) {
        endIndex = nextPeriod + 1;
      }
    }
    
    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    const overlap = Math.floor(maxChunkSize * overlapRatio);
    startIndex = endIndex - overlap;
  }
  
  return chunks;
}

export async function POST(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { title, content, category, chat_id } = await request.json();

    if (!title?.trim() || !content?.trim() || !chat_id) {
      return new Response('Title, content, and chat_id are required', { status: 400 });
    }

    // Generate embeddings for the content
    const chunks = chunkText(content);
    const processedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      processedChunks.push({
        chunk_index: i,
        content: chunks[i],
        embedding
      });
    }

    // Create memory with chunks
    const { data: memoryId, error } = await supabase.rpc(
      'create_memory_and_chunks',
      {
        p_user_id: user.id,
        p_chat_id: chat_id,
        p_title: title.trim(),
        p_content: content.trim(),
        p_category: category?.trim() || null,
        p_chunks: processedChunks
      }
    );

    if (error) {
      console.error('Error creating memory:', error);
      return new Response('Error creating memory', { status: 500 });
    }

    // Return the created memory
    const { data: newMemory } = await supabase
      .from('memories')
      .select(`
        id,
        title,
        content,
        category,
        created_at,
        updated_at,
        chat_id,
        chats!inner(title)
      `)
      .eq('id', memoryId)
      .single();

    return Response.json(newMemory);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { memoryIds } = await request.json();

    if (!Array.isArray(memoryIds) || memoryIds.length === 0) {
      return new Response('Memory IDs are required', { status: 400 });
    }

    // Delete memories (sections will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('user_id', user.id)
      .in('id', memoryIds);

    if (error) {
      console.error('Error deleting memories:', error);
      return new Response('Error deleting memories', { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}