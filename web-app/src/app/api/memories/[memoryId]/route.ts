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

    // Update memory and get the updated data in the same operation using .select()
    const { data: updatedMemory, error: updateError } = await supabase
      .from('memories')
      .update({
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryIdNumber)
      .eq('user_id', user.id)
      .select(`
        id,
        title,
        content,
        category,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating memory:', updateError);
      return new Response('Error updating memory', { status: 500 });
    }

    if (!updatedMemory) {
      return new Response('Memory not found', { status: 404 });
    }

    // Delete old chunks
    await supabase
      .from('memory_sections')
      .delete()
      .eq('memory_id', memoryIdNumber);

    // Batch insert all chunks at once instead of one by one
    if (dbChunks.length > 0) {
      const chunksToInsert = dbChunks.map(chunk => ({
        memory_id: memoryIdNumber,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        embedding: JSON.stringify(chunk.embedding)
      }));

      const { error: insertError } = await supabase
        .from('memory_sections')
        .insert(chunksToInsert);

      if (insertError) {
        console.error('Error inserting chunks:', insertError);
        // Memory is updated but chunks failed - you may want to handle this
      }
    }
      
    console.log("the updated memory is ", updatedMemory);

    return Response.json(updatedMemory);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}