// /app/api/projects/[id]/files/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database, Json } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { processProjectFile, prepareChunksForDatabase } from '@/lib/services/content-processing';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response('Project not found', { status: 404 });
    }

    // Get project-specific files
    const { data: files, error } = await supabase
      .from('documents')
      .select('title, id, content, created_at, updated_at')
      .eq('project_id', projectId)
      .eq('is_direct_file', true)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('Error fetching project files:', error);
      return new Response('Error fetching files', { status: 500 });
    }

    return Response.json(files || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response('Project not found', { status: 404 });
    }

    const { title, content } = await request.json();

    if (!title?.trim()) {
      return new Response('Title is required', { status: 400 });
    }

    console.log(`📝 Processing content for: ${title}`);

    // Use centralized content processing service to chunk the content and generate embeddings
    const processed = await processProjectFile(content || '', { maxChunkSize: 3000, overlapRatio: 0.6 });
    
    console.log(`📦 Processed ${processed.contentType} content into ${processed.chunks.length} searchable chunks`);

    // Prepare chunks for database
    const dbChunks = prepareChunksForDatabase(processed.chunks);

    // Create file with chunks using RPC function
    const { data: documentId, error } = await supabase.rpc(
      'create_direct_file_and_chunks_by_project',
      {
        p_user_id: user.id,
        p_title: title.trim(),
        p_content: processed.originalContent, // Store original (HTML) for display
        p_chunks: dbChunks as unknown as Json, // Store cleaned chunks for search
        p_project_id: projectId
      }
    );

    if (error) {
      console.error('Error creating file:', error);
      return new Response('Error creating file', { status: 500 });
    }

    console.log(`✅ Created file with ${processed.chunks.length} searchable chunks`);

    // Return the created file
    const { data: newFile } = await supabase
      .from('documents')
      .select('id, title, content, created_at, updated_at')
      .eq('id', documentId)
      .single();

    return Response.json(newFile);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { fileIds } = await request.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return new Response('File IDs are required', { status: 400 });
    }

    // Delete files (document_sections will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('is_direct_file', true)
      .in('id', fileIds);

    if (error) {
      console.error('Error deleting files:', error);
      return new Response('Error deleting files', { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}