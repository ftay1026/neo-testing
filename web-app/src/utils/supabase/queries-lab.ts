import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type PromptComparison = Database['public']['Tables']['prompt_comparisons']['Row'];

// Prompt Operations

export async function getPromptsByType(
  supabase: SupabaseClient<Database>,
  type: string = 'system'
) {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUsedPromptByType(
  supabase: SupabaseClient<Database>,
  type: string = 'system'
) {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('type', type)
    .eq('used', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createPrompt(
  supabase: SupabaseClient<Database>,
  promptData: {
    type: string;
    name: string;
    prompt: string;
    primingPrompt: string;
    used?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('prompts')
    .insert(promptData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePrompt(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: {
    name?: string;
    prompt?: string;
    used?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('prompts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setPromptAsUsed(
  supabase: SupabaseClient<Database>,
  id: string,
  type: string
) {
  // First, unset all prompts of this type
  const { error: unsetError } = await supabase
    .from('prompts')
    .update({ used: false })
    .eq('type', type)
    .eq('used', true);

  if (unsetError) throw unsetError;

  // Then set the target prompt as used
  const { data, error } = await supabase
    .from('prompts')
    .update({ used: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePrompt(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Comparison Operations

export async function getComparisons(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('prompt_comparisons')
    .select(`
      *,
      prompt_a:prompts!prompt_comparisons_prompt_a_id_fkey(id, name, prompt),
      prompt_b:prompts!prompt_comparisons_prompt_b_id_fkey(id, name, prompt)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getComparisonById(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase
    .from('prompt_comparisons')
    .select(`
      *,
      prompt_a:prompts!prompt_comparisons_prompt_a_id_fkey(id, name, prompt),
      prompt_b:prompts!prompt_comparisons_prompt_b_id_fkey(id, name, prompt)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createComparison(
  supabase: SupabaseClient<Database>,
  comparisonData: {
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
) {
  const { data, error } = await supabase
    .from('prompt_comparisons')
    .insert(comparisonData)
    .select()
    .single();

  if (error) throw error;
  return data;
}