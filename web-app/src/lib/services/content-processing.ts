// /lib/services/content-processing.ts
export interface ProcessedChunk {
  chunk_index: number;
  content: string;
  embedding: number[];
}

export interface ContentProcessingOptions {
  maxChunkSize?: number;
  overlapRatio?: number;
  preserveFormatting?: boolean; // Whether to store original HTML for display
}

export interface ProcessedContent {
  chunks: ProcessedChunk[];
  originalContent: string;
  processedContent: string; // Cleaned text used for chunking
  contentType: 'html' | 'markdown' | 'text';
}

class ContentProcessingService {
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private readonly EMBEDDING_MODEL = 'text-embedding-ada-002';

  /**
   * Detect content type based on content patterns
   */
  detectContentType(content: string): 'html' | 'markdown' | 'text' {
    if (/<[^>]+>/.test(content)) return 'html';
    if (/^#{1,6}\s+|^\*\s+|^-\s+|^\d+\.\s+|\*\*.*?\*\*|\*.*?\*|`.*?`/.test(content)) return 'markdown';
    return 'text';
  }

  /**
   * Strip HTML tags while preserving document structure
   */
  stripHtmlTags(html: string): string {
    return html
      // Replace block elements with newlines to preserve structure
      .replace(/<\/?(h[1-6]|p|div|section|article|header|footer|nav|main)[^>]*>/gi, '\n')
      .replace(/<\/(ul|ol|li|blockquote)[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      
      // Remove all other HTML tags but keep content
      .replace(/<[^>]+>/g, '')
      
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      
      // Clean up whitespace while preserving structure
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  /**
   * Chunk text with smart boundary detection
   */
  chunkText(text: string, options: ContentProcessingOptions = {}): string[] {
    const { maxChunkSize = 1000, overlapRatio = 0.2 } = options;
    const chunks: string[] = [];
    let startIndex = 0;
    
    while (startIndex < text.length) {
      let endIndex = startIndex + maxChunkSize;
      
      if (endIndex < text.length) {
        // Smart boundary detection: prefer paragraph > sentence > word breaks
        const nextNewline = text.indexOf('\n\n', endIndex);
        const nextSentence = text.indexOf('. ', endIndex);
        const nextPeriod = text.indexOf('.', endIndex);
        
        if (nextNewline !== -1 && nextNewline - endIndex < 200) {
          endIndex = nextNewline + 2;
        } else if (nextSentence !== -1 && nextSentence - endIndex < 150) {
          endIndex = nextSentence + 2;
        } else if (nextPeriod !== -1 && nextPeriod - endIndex < 100) {
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

  /**
   * Generate embedding for text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.EMBEDDING_MODEL,
          input: text
        })
      });
      
      const result = await response.json();

      if (!result.data?.[0]?.embedding) {
        throw new Error('Invalid embedding response from OpenAI API');
      }
      
      const vector: number[] = result.data[0].embedding;
      
      // Normalize vector for better similarity search
      const magnitude = Math.sqrt(vector.reduce((sum: number, val: number) => sum + val * val, 0));
      return vector.map((val: number) => val / magnitude);
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  /**
   * Process content for different content types (projects, memories, logs)
   */
  async processContent(
    content: string, 
    options: ContentProcessingOptions = {}
  ): Promise<ProcessedContent> {
    const contentType = this.detectContentType(content);
    
    // Determine text to use for chunking and embeddings
    let textForProcessing: string;
    
    if (contentType === 'html') {
      textForProcessing = this.stripHtmlTags(content);
      console.log('🧹 Cleaned HTML content for processing');
    } else {
      textForProcessing = content;
    }
    
    // Generate chunks from cleaned text
    const textChunks = this.chunkText(textForProcessing, options);
    console.log(`📦 Created ${textChunks.length} chunks from content`);
    
    // Generate embeddings for each chunk
    const processedChunks: ProcessedChunk[] = [];
    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await this.generateEmbedding(textChunks[i]);
      processedChunks.push({
        chunk_index: i,
        content: textChunks[i], // Store cleaned text for search
        embedding
      });
    }
    
    return {
      chunks: processedChunks,
      originalContent: content, // Store original for display
      processedContent: textForProcessing, // Store cleaned for reference
      contentType
    };
  }
}

// Singleton instance
export const contentProcessor = new ContentProcessingService();

// Convenience functions for different use cases
export const processProjectFile = (content: string, options?: ContentProcessingOptions) =>
  contentProcessor.processContent(content, { maxChunkSize: 1000, ...options });

export const processMemory = (content: string, options?: ContentProcessingOptions) =>
  contentProcessor.processContent(content, { maxChunkSize: 500, ...options });

export const processInteractionLog = (content: string, options?: ContentProcessingOptions) =>
  contentProcessor.processContent(content, { maxChunkSize: 800, ...options });

// Type helpers for database operations
export interface DatabaseChunk {
  chunk_index: number;
  content: string;
  embedding: number[] | string; // Handle both formats
}

export const prepareChunksForDatabase = (chunks: ProcessedChunk[]): DatabaseChunk[] =>
  chunks.map(chunk => ({
    ...chunk,
    embedding: chunk.embedding // Keep as array; RPC function handles conversion
  }));