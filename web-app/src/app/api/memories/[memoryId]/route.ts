// src/app/api/memories/[memoryId]/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { processMemory, prepareChunksForDatabase } from '@/lib/services/content-processing';

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

    // Use centralized content processing service to chunk the content and generate embeddings
    const processed = await processMemory(content.trim());
    
    console.log(`📦 Processed into ${processed.chunks.length} searchable chunks`);

    // Prepare chunks for database
    const dbChunks = prepareChunksForDatabase(processed.chunks);

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
    for (const chunk of dbChunks) {
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