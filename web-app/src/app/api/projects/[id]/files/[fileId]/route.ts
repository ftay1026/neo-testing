// /app/api/projects/[id]/files/[fileId]/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params;
    const supabase = await createClient();
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

    // Update file with chunks using the RPC function
    const { error } = await supabase.rpc(
      'update_direct_file_and_chunks',
      {
        p_document_id: fileIdNumber,
        p_user_id: user.id,
        p_title: title.trim(),
        p_content: content || '',
        p_chunks: processedChunks
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