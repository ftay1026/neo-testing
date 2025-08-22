import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const user = await getUser(supabase);

  if (!user || !user.id) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  try {
    const { docUrl } = await request.json();

    if (!docUrl?.trim()) {
      return new Response('Document URL is required', { status: 400 });
    }

    // Validate if URL is a Google Docs URL
    if (!docUrl.includes('docs.google.com/document/d/')) {
      return new Response('Please enter a valid Google Docs URL', { status: 400 });
    }

    // Extract document ID from URL
    const regex = /\/document\/d\/([a-zA-Z0-9-_]+)/;
    const match = docUrl.match(regex);
    
    if (!match) {
      return new Response('Could not extract document ID from URL', { status: 400 });
    }

    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DocFetcher/1.0)',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return new Response(
          'Document is not publicly accessible. Please make sure the document is shared with "Anyone with the link can view".',
          { status: 403 }
        );
      }
      throw new Error(`Failed to fetch document: ${response.status}`);
    }

    const content = await response.text();
    
    if (!content.trim()) {
      return new Response('Document appears to be empty', { status: 400 });
    }

    return Response.json({ 
      content,
      title: `${content.length > 50 ? content.substring(0, 47) + '...' : ''}`,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching Google Doc:', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to fetch document',
      { status: 500 }
    );
  }
}