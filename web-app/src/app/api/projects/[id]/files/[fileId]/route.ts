// /app/api/projects/[id]/files/[fileId]/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database, Json } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { processProjectFile, prepareChunksForDatabase } from '@/lib/services/content-processing';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const fileIdNumber = parseInt(fileId);
    if (isNaN(fileIdNumber)) {
      return new Response('Invalid file ID', { status: 400 });
    }

    const { title, content } = await request.json();

    if (!title?.trim()) {
      return new Response('Title is required', { status: 400 });
    }

    // Use centralized content processing service to chunk the content and generate embeddings
    const processed = await processProjectFile(content || '', { maxChunkSize: 2000, overlapRatio: 0.2 });
    
    console.log(`📦 Processed ${processed.contentType} content into ${processed.chunks.length} searchable chunks`);

    // Prepare chunks for database
    const dbChunks = prepareChunksForDatabase(processed.chunks);

    // Update file with chunks using the RPC function
    const { error } = await supabase.rpc(
      'update_direct_file_and_chunks',
      {
        p_document_id: fileIdNumber,
        p_user_id: user.id,
        p_title: title.trim(),
        p_content: processed.originalContent, // Store original (HTML) for display
        p_chunks: dbChunks as unknown as Json, // Store cleaned chunks for search
      }
    );

    if (error) {
      console.error('Error updating file:', error);
      return new Response('Error updating file', { status: 500 });
    }

    // Return the updated file
    const { data: updatedFile } = await supabase
      .from('documents')
      .select('id, title, content, created_at, updated_at')
      .eq('id', fileIdNumber)
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('is_direct_file', true)
      .single();

    if (!updatedFile) {
      return new Response('File not found', { status: 404 });
    }

    return Response.json(updatedFile);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}
