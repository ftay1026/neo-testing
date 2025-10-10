import { Database } from '@/types/database.types';

// Base types from database
export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type PromptInsert = Database['public']['Tables']['prompts']['Insert'];
export type PromptUpdate = Database['public']['Tables']['prompts']['Update'];

export type PromptComparison = Database['public']['Tables']['prompt_comparisons']['Row'];
export type PromptComparisonInsert = Database['public']['Tables']['prompt_comparisons']['Insert'];

// Extended types with relations
export type PromptWithRelations = Prompt;

export type ComparisonWithRelations = PromptComparison & {
  prompt_a: Prompt;
  prompt_b: Prompt;
};

// API response types
export interface ComparisonRunResult {
  responseA: string;
  responseB: string;
  usageA?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  usageB?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Form data types
export interface CreatePromptData {
  type: string;
  name: string;
  prompt: string;
  used?: boolean;
}

export interface UpdatePromptData {
  name?: string;
  prompt?: string;
  used?: boolean;
  type?: string;
}

export interface RunComparisonParams {
  promptA: string;
  promptB: string;
  modelA: string;
  modelB: string;
  temperature: number;
  maxTokens: number;
  userPrompt: string;
}

export interface SaveComparisonData {
  prompt_a_id: string;
  prompt_b_id: string;
  model_a: string;
  model_b: string;
  temperature: number;
  max_tokens: number;
  user_prompt: string;
  response_a: string;
  response_b: string;
  vote_result?: 'a' | 'b' | 'tie' | null;
  notes?: string;
}

export type VoteResult = 'a' | 'b' | 'tie';

// Component props types
export interface PromptPanelProps {
  label: string;
  name: string;
  setName: (name: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  primingPrompt: string;
  setPrimingPrompt: (primingPrompt: string) => void;
  model: string;
  setModel: (model: string) => void;
  savedPrompts: Prompt[];
  usedPrompt: Prompt | null | undefined;
  onSave: () => Promise<void>;
  onLoadSaved: (id: string) => void;
  onLoadDefault: () => void;
  onLoadUsed: () => void;
  onUsePrompt: () => Promise<void>;
  onDeletePrompt?: (id: string) => void;
  onEditPromptName?: (id: string, newName: string) => Promise<void>;
  promptType: string;
}

export interface ComparisonResultsProps {
  responseA: string;
  responseB: string;
  usageA?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  usageB?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  onVote: (result: VoteResult) => void;
  onSave: (notes: string) => Promise<void>;
  voteResult: VoteResult | null;
}