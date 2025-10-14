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
        chat_id,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memories:', error);
      return new Response('Error fetching memories', { status: 500 });
    }
    console.log('API memories:', memories);

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
    console.log("the chat id is ", chat_id)
    if (!title?.trim() || !content?.trim()) {
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
        p_chat_id: chat_id || null,
        p_title: title.trim(),
        p_content: processed.originalContent,
        p_category: category?.trim() || null,
        p_chunks: dbChunks as unknown as Json, // Store cleaned chunks for search
      }
    );

    console.log("the memory id is ", memoryId)
    console.log("memoryId type:", typeof memoryId, "value:", memoryId);


    if (error) {
      console.error('Error creating memory:', error);
      return new Response('Error creating memory', { status: 500 });
    }

    // Try to get the created memory back from the RPC if it returns the row (see schema change).
    // If the RPC still only returns the id, fall back to a direct select by id.
    let newMemory: any = null;

    // If the RPC returned a record (object with an id), memoryId may be that row already
    if (memoryId && typeof memoryId === 'object' && 'id' in (memoryId as any)) {
      newMemory = memoryId;
    }

    if (!newMemory) {
      const { data: fetched, error: fetchError } = await supabase
        .from('memories')
        .select(`
          id,
          title,
          content,
          category,
          chat_id,
          created_at,
          updated_at
        `)
        .eq('id', memoryId)
        .single();

      if (fetchError) {
        console.error('Error fetching newly created memory:', fetchError);
      }
      newMemory = fetched;
    }

    console.log('the new memory is ', newMemory);
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