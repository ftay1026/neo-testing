// src/app/api/memories/[memoryId]/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const memoryIdNumber = parseInt(memoryId);
    if (isNaN(memoryIdNumber)) {
      return new Response('Invalid memory ID', { status: 400 });
    }

    const { title, content, category } = await request.json();

    if (!title?.trim() || !content?.trim()) {
      return new Response('Title and content are required', { status: 400 });
    }

    // Generate new embeddings
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

    // Update memory
    const { error: updateError } = await supabase
      .from('memories')
      .update({
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryIdNumber)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating memory:', updateError);
      return new Response('Error updating memory', { status: 500 });
    }

    // Delete old chunks and insert new ones
    await supabase
      .from('memory_sections')
      .delete()
      .eq('memory_id', memoryIdNumber);

    // Insert new chunks
    for (const chunk of processedChunks) {
      await supabase
        .from('memory_sections')
        .insert({
          memory_id: memoryIdNumber,
          chunk_index: chunk.chunk_index,
          content: chunk.content,
          embedding: JSON.stringify(chunk.embedding)
        });
    }

    // Return updated memory
    const { data: updatedMemory } = await supabase
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
      .eq('id', memoryIdNumber)
      .eq('user_id', user.id)
      .single();

    if (!updatedMemory) {
      return new Response('Memory not found', { status: 404 });
    }

    return Response.json(updatedMemory);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}