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

    // First, try to get the document title
    let title = 'Imported Google Doc';
    try {
      const titleResponse = await fetch(`https://docs.google.com/document/d/${docId}/edit`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DocFetcher/1.0)',
        },
      });
      
      if (titleResponse.ok) {
        const htmlContent = await titleResponse.text();
        // Extract title from the page HTML
        const titleMatch = htmlContent.match(/<title>([^<]+)/);
        if (titleMatch) {
          // Clean up the title (remove " - Google Docs" suffix)
          title = titleMatch[1].replace(/\s*-\s*Google\s*Docs\s*$/i, '').trim();
        }
      }
    } catch (error) {
      console.warn('Could not extract document title:', error);
    }

    // Try HTML export first for better formatting preservation
    const htmlExportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
    
    let content = '';
    let isHtmlContent = false;

    try {
      const htmlResponse = await fetch(htmlExportUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DocFetcher/1.0)',
        },
      });

      if (htmlResponse.ok) {
        const htmlContent = await htmlResponse.text();
        // Clean up Google Docs HTML but keep it as HTML for Tiptap
        content = cleanGoogleDocsHtml(htmlContent);
        isHtmlContent = true;
      }
    } catch (error) {
      console.warn('HTML export failed, falling back to text:', error);
    }

    // Fallback to text export if HTML fails
    if (!isHtmlContent) {
      const textExportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      
      const response = await fetch(textExportUrl, {
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

      content = await response.text();
    }
    
    if (!content.trim()) {
      return new Response('Document appears to be empty', { status: 400 });
    }

    return Response.json({ 
      content,
      title,
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

function cleanGoogleDocsHtml(html: string): string {
  // Extract body content and clean up Google Docs specific elements
  let content = html;
  
  // Remove head section and keep only body content
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  }

  // Clean up Google Docs specific attributes and styles while preserving structure
  content = content
    // Remove Google Docs specific IDs and classes but keep the HTML structure
    .replace(/\s+id="[^"]*"/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/\s+style="[^"]*"/gi, '')
    .replace(/\s+dir="[^"]*"/gi, '')
    
    // Remove Google Docs specific tags but keep content
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    
    // Clean up excessive whitespace while preserving paragraph breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/>\s+</g, '><')
    .trim();

  // Ensure we have valid HTML structure for Tiptap
  if (content && !content.includes('<p>') && !content.includes('<h')) {
    // If no paragraphs or headers, wrap in paragraph tags
    content = `<p>${content}</p>`;
  }

  return content;
}