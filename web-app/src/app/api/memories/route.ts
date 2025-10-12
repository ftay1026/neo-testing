// src/app/api/memories/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database, Json } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { processMemory, prepareChunksForDatabase } from '@/lib/services/content-processing';

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

    // Use centralized content processing service to chunk the content and generate embeddings
    const processed = await processMemory(content.trim());
    
    console.log(`📦 Processed into ${processed.chunks.length} searchable chunks`);

    // Prepare chunks for database
    const dbChunks = prepareChunksForDatabase(processed.chunks);

    // Create memory with chunks using RPC function
    const { data: memoryId, error } = await supabase.rpc(
      'create_memory_and_chunks',
      {
        p_user_id: user.id,
        p_chat_id: chat_id,
        p_title: title.trim(),
        p_content: processed.originalContent,
        p_category: category?.trim() || null,
        p_chunks: dbChunks as unknown as Json, // Store cleaned chunks for search
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