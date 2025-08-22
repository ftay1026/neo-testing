// /app/api/projects/[id]/files/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
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
      .order('updated_at', { ascending: false });

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

// Helper function to chunk text and generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
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
    throw new Error('Failed to generate embedding');
  }
  
  // Normalize vector
  const vector = result.data[0].embedding;
  const magnitude = Math.sqrt(vector.reduce((sum: number, val: number) => sum + val * val, 0));
  return vector.map((val: number) => val / magnitude);
}

function chunkText(text: string, maxChunkSize = 1000, overlapRatio = 0.2) {
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

export async function POST(
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

    // Chunk the content and generate embeddings
    const chunks = chunkText(content || '');
    const processedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      processedChunks.push({
        chunk_index: i,
        content: chunks[i],
        embedding
      });
    }

    // Create file with chunks using the project-specific RPC function
    const { data: documentId, error } = await supabase.rpc(
      'create_direct_file_and_chunks_by_project',
      {
        p_user_id: user.id,
        p_title: title.trim(),
        p_content: content || '',
        p_chunks: processedChunks,
        p_project_id: projectId
      }
    );

    if (error) {
      console.error('Error creating file:', error);
      return new Response('Error creating file', { status: 500 });
    }

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