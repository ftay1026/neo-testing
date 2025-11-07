// /lib/services/search-service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchQuery {
  originalQuery: string;
  userId: string;
  timestamp: string;
}

export type SearchStrategy = 
  | 'semantic'           // Vector similarity search
  | 'title_exact'        // Exact title match
  | 'title_fuzzy'        // Fuzzy title match
  | 'fulltext'           // Full-text search in content
  | 'keyword'            // Specific keyword/entity search
  | 'hybrid';            // Combined strategy

export type ContentSource = 
  | 'memory'             // User memories
  | 'document'           // Project files
  | 'interaction_log';   // Chat logs

export interface SearchOptions {
  projectId?: string;
  userId: string;
  maxTokens?: number;
  prioritySource?: ContentSource;
  maxResults?: number;
  matchThreshold?: number;
}

export interface SearchResultMetadata {
  // Source identification
  documentId?: string;           // For documents
  memoryId?: number;             // For memories
  logId?: number;                // For interaction logs
  
  // Content details
  filename?: string;             // Original file name
  title: string;                 // Display title
  category?: string;             // For memories
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Ownership
  userId: string;
  projectId?: string;
  chatId?: string;               // For memories tied to specific chats
  
  // Size information
  totalTokens: number;           // Total size of source document
}

export interface SearchResult {
  // Unique identifier for this result
  id: string;                    // Composite: `${source}_${documentId|memoryId|logId}_${strategy}`
  
  // Classification
  source: ContentSource;
  strategy: SearchStrategy;
  
  // The actual content to use
  content: string;               // The text to include in context
  
  // Relevance scoring
  relevanceScore: number;        // 0-1, normalized across strategies
  
  // Rich metadata
  metadata: SearchResultMetadata;
  
  // Processing flags
  isTruncated: boolean;          // Was content truncated to fit?
  originalLength?: number;       // Length before truncation
}

// ============================================================================
// SEARCH RESULT BUILDER
// ============================================================================

export class SearchResultBuilder {
  private result: Partial<SearchResult>;
  
  constructor(source: ContentSource, strategy: SearchStrategy, query: SearchQuery) {
    this.result = {
      source,
      strategy,
      relevanceScore: 0,
      isTruncated: false,
      metadata: {
        title: '',
        userId: '',
        totalTokens: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
  }
  
  // Core content
  withContent(content: string): this {
    this.result.content = content;
    this.result.originalLength = content.length;
    return this;
  }
  
  // Identification
  fromDocument(documentId: string, filename: string): this {
    this.result.metadata!.documentId = documentId;
    this.result.metadata!.filename = filename;
    this.result.id = `document_${documentId}_${this.result.strategy}`;
    return this;
  }
  
  fromMemory(memoryId: number, title: string, category?: string): this {
    this.result.metadata!.memoryId = memoryId;
    this.result.metadata!.title = title;
    this.result.metadata!.category = category;
    this.result.id = `memory_${memoryId}_${this.result.strategy}`;
    return this;
  }
  
  fromLog(logId: number, title: string): this {
    this.result.metadata!.logId = logId;
    this.result.metadata!.title = title;
    this.result.id = `log_${logId}_${this.result.strategy}`;
    return this;
  }
  
  // Scoring
  withRelevanceScore(score: number): this {
    this.result.relevanceScore = Math.max(0, Math.min(1, score));
    return this;
  }
  
  // Project/ownership
  withProjectId(projectId: string): this {
    this.result.metadata!.projectId = projectId;
    return this;
  }
  
  withUserId(userId: string): this {
    this.result.metadata!.userId = userId;
    return this;
  }
  
  withChatId(chatId: string): this {
    this.result.metadata!.chatId = chatId;
    return this;
  }
  
  // Size/truncation
  withTokenCount(tokens: number): this {
    this.result.metadata!.totalTokens = tokens;
    return this;
  }
  
  markTruncated(newLength: number): this {
    this.result.isTruncated = true;
    this.result.originalLength = this.result.content?.length || 0;
    this.result.content = this.result.content?.substring(0, newLength) || '';
    return this;
  }
  
  // Timestamps
  withTimestamps(created: string, updated: string): this {
    this.result.metadata!.createdAt = created;
    this.result.metadata!.updatedAt = updated;
    return this;
  }
  
  build(): SearchResult {
    if (!this.result.id || !this.result.content) {
      throw new Error('SearchResult must have id and content');
    }
    return this.result as SearchResult;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  
  // Try to truncate at sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('. ');
  if (lastPeriod > maxChars * 0.8) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  return truncated + '...';
}

function normalizeScore(score: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, score));
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

async function generateEmbedding(text: string): Promise<number[]> {
  try {
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
      throw new Error('Invalid embedding response from OpenAI API');
    }
    
    const vector: number[] = result.data[0].embedding;
    const magnitude = Math.sqrt(vector.reduce((sum: number, val: number) => sum + val * val, 0));
    return vector.map((val: number) => val / magnitude);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Array(1536).fill(0);
  }
}

// ============================================================================
// MAIN SEARCH SERVICE
// ============================================================================

export class SearchService {
  private supabase: SupabaseClient<Database>;
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
  
  /**
   * Semantic search across documents and memories
   * This is the primary search method that runs on every chat message
   */
  async semanticSearch(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const embedding = await generateEmbedding(query.originalQuery);
    const results: SearchResult[] = [];
    
    // Search documents
    const { data: docs, error: docError } = await this.supabase.rpc(
      'match_document_sections_by_project',
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: options.matchThreshold || 0.7,
        match_count: options.maxResults || 5,
        p_user_id: options.userId,
        p_project_id: options.projectId
      }
    );
    
    if (docError) {
      console.error('Document semantic search error:', docError);
    } else if (docs) {
      results.push(...docs.map(doc => 
        new SearchResultBuilder('document', 'semantic', query)
          .fromDocument(doc.id.toString(), doc.filename)
          .withContent(doc.content)
          .withRelevanceScore(doc.similarity)
          .withProjectId(options.projectId || '')
          .withUserId(options.userId)
          .build()
      ));
    }
    
    // Search memories
    const { data: memories, error: memError } = await this.supabase.rpc(
      'match_user_memories',
      {
        query_embedding: JSON.stringify(embedding),
        match_threshold: options.matchThreshold || 0.7,
        match_count: options.maxResults || 5,
        p_user_id: options.userId
      }
    );
    
    if (memError) {
      console.error('Memory semantic search error:', memError);
    } else if (memories) {
      results.push(...memories.map(mem => 
        new SearchResultBuilder('memory', 'semantic', query)
          .fromMemory(mem.id, mem.title, mem.category)
          .withContent(mem.content)
          .withRelevanceScore(mem.similarity)
          .withUserId(options.userId)
          .build()
      ));
    }
    
    return this.selectTopResults(results, options);
  }

  async titleSearch(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const searchTerm = query.originalQuery;
    
    const { data: docs, error } = await this.supabase.rpc(
      'search_documents_by_title',
      {
        p_search_term: searchTerm,
        p_user_id: options.userId,
        p_project_id: options.projectId!, // Hint: projectId is required for title search
        p_match_count: options.maxResults || 5
      }
    );
    
    if (error) {
      console.error('Title search error:', error);
      return [];
    }
    
    if (!docs || docs.length === 0) return [];
    
    const titleResults: SearchResult[] = docs.map(doc => {
      const titleLower = doc.title.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      // Determine strategy based on match quality
      let strategy: SearchStrategy;
      let relevanceScore: number;
      
      if (titleLower === searchLower) {
        strategy = 'title_exact';
        relevanceScore = 1.0;
      } else if (titleLower.startsWith(searchLower) || titleLower.includes(searchLower)) {
        strategy = 'title_fuzzy';
        relevanceScore = titleLower.startsWith(searchLower) ? 0.85 : 0.9;
      } else {
        strategy = 'title_fuzzy';
        relevanceScore = 0.7;
      }
      
      return new SearchResultBuilder('document', strategy, query)
        .fromDocument(doc.id.toString(), doc.title)
        .withContent(doc.content)
        .withRelevanceScore(relevanceScore)
        .withProjectId(options.projectId || '')
        .withUserId(options.userId)
        .withTimestamps(doc.created_at, doc.updated_at)
        .withTokenCount(estimateTokens(doc.content))
        .build();
    });
    
    return this.selectTopResults(titleResults, options);
  }
  
  /**
   * Select top results within token budget
   */
  private selectTopResults(
    results: SearchResult[],
    options: SearchOptions
  ): SearchResult[] {
    const maxTokens = options.maxTokens || 4000;
    const selected: SearchResult[] = [];
    let currentTokens = 0;
    
    // Sort by relevance
    const sorted = results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Prioritize by source if specified
    let prioritized = sorted;
    if (options.prioritySource) {
      const priority = sorted.filter(r => r.source === options.prioritySource);
      const others = sorted.filter(r => r.source !== options.prioritySource);
      prioritized = [...priority, ...others];
    }
    
    for (const result of prioritized) {
      const resultTokens = result.metadata.totalTokens;
      
      if (currentTokens + resultTokens <= maxTokens) {
        selected.push(result);
        currentTokens += resultTokens;
      } else {
        // Try to fit a truncated version
        const remaining = maxTokens - currentTokens;
        if (remaining > 100) {
          const truncated = { ...result };
          truncated.content = truncateToTokenLimit(result.content, remaining);
          truncated.isTruncated = true;
          truncated.originalLength = result.content.length;
          truncated.metadata.totalTokens = remaining;
          selected.push(truncated);
          break; // Budget exhausted
        }
      }
    }
    
    return selected;
  }
  
  /**
   * Format search results for LLM context
   */
  formatResultsForContext(results: SearchResult[]): string {
    if (results.length === 0) return '';
    
    const documents = results.filter(r => r.source === 'document');
    const memories = results.filter(r => r.source === 'memory');
    
    let context = '';
    
    // Add memories first (personal context)
    if (memories.length > 0) {
      context += 'Personal memories to reference:\n\n';
      memories.forEach(mem => {
        const category = mem.metadata.category ? ` - ${mem.metadata.category}` : '';
        context += `[${mem.metadata.title}${category}]\n${mem.content}\n\n`;
      });
      context = `---\nUse the below personal information about the user to provide more personalized and relevant responses. These are things the user has specifically asked you to remember:\n---\n\n${context}---\nEnd of personal memories.\n---\n\n`;
    }
    
    // Add documents second (project knowledge)
    if (documents.length > 0) {
      context += 'Context from user Files:\n\n';
      documents.forEach(doc => {
        context += `[${doc.metadata.filename}]\n${doc.content}\n\n`;
      });
      context = `---\nUse the below context to provide relevant insights to the user, but don't explicitly mention that you're reading from these files unless the user asks about their Files.\n---\n\n${context}---\nEnd of context from user Files.\n---\n\n`;
    }
    
    return context;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export const createSearchService = (supabase: SupabaseClient<Database>) => {
  return new SearchService(supabase);
};