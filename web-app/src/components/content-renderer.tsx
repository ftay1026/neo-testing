import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentRendererProps {
  content: string;
  className?: string;
}

export function ContentRenderer({ content, className = "" }: ContentRendererProps) {
  // Simple detection: if it contains HTML tags, render as HTML
  const hasHtmlTags = /<[^>]+>/.test(content);
  
  // Check for common markdown patterns
  const hasMarkdown = /^#{1,6}\s+|^\*\s+|^-\s+|^\d+\.\s+|\*\*.*?\*\*|\*.*?\*|`.*?`/.test(content);
  
  if (hasHtmlTags) {
    // Render HTML content
    return (
      <div 
        className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  } else if (hasMarkdown) {
    // Render as markdown
    return (
      <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  } else {
    // Render as plain text with line breaks preserved
    return (
      <div className={`whitespace-pre-wrap text-sm ${className}`}>
        {content}
      </div>
    );
  }
}