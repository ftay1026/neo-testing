'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { Prompt, CreatePromptData, UpdatePromptData, ComparisonWithRelations, ComparisonRunResult, RunComparisonParams, SaveComparisonData, PromptComparison } from '@/types/lab.types';

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

interface UsePromptsReturn {
  prompts: Prompt[];
  isLoading: boolean;
  isError: Error | undefined;
  createPrompt: (promptData: CreatePromptData) => Promise<Prompt>;
  updatePrompt: (id: string, updates: UpdatePromptData) => Promise<Prompt>;
  deletePrompt: (id: string) => Promise<void>;
  mutate: () => Promise<void>;
}

export function usePrompts(type: string = 'system'): UsePromptsReturn {
  const { data, error, mutate, isLoading } = useSWR<Prompt[]>(
    `/api/lab/prompts?type=${type}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const createPrompt = async (promptData: CreatePromptData): Promise<Prompt> => {
    try {
      const response = await fetch('/api/lab/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) throw new Error('Failed to create prompt');

      const newPrompt = await response.json();
      mutate();
      toast.success('Prompt saved successfully');
      return newPrompt;
    } catch (error) {
      toast.error('Failed to save prompt');
      throw error;
    }
  };

  const updatePrompt = async (id: string, updates: UpdatePromptData): Promise<Prompt> => {
    try {
      const response = await fetch(`/api/lab/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update prompt');

      const updatedPrompt = await response.json();
      mutate();
      toast.success(updates.used ? 'Prompt marked as used' : 'Prompt updated');
      return updatedPrompt;
    } catch (error) {
      toast.error('Failed to update prompt');
      throw error;
    }
  };

  const deletePrompt = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/lab/prompts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete prompt');

      mutate();
      toast.success('Prompt deleted');
    } catch (error) {
      toast.error('Failed to delete prompt');
      throw error;
    }
  };

  return {
    prompts: data || [],
    isLoading,
    isError: error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    mutate: async () => {
      await mutate();
    },
  };
}

interface UseComparisonsReturn {
  comparisons: ComparisonWithRelations[];
  isLoading: boolean;
  isError: Error | undefined;
  runComparison: (params: RunComparisonParams) => Promise<ComparisonRunResult>;
  saveComparison: (comparisonData: SaveComparisonData) => Promise<PromptComparison>;
  mutate: () => Promise<void>;
}

export function useComparisons(): UseComparisonsReturn {
  const { data, error, mutate, isLoading } = useSWR<ComparisonWithRelations[]>(
    '/api/lab/comparisons',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const runComparison = async (params: RunComparisonParams): Promise<ComparisonRunResult> => {
    try {
      const response = await fetch('/api/lab/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error('Failed to run comparison');

      return await response.json();
    } catch (error) {
      toast.error('Failed to run comparison');
      throw error;
    }
  };

  const saveComparison = async (comparisonData: SaveComparisonData): Promise<PromptComparison> => {
    try {
      const response = await fetch('/api/lab/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comparisonData),
      });

      if (!response.ok) throw new Error('Failed to save comparison');

      const comparison = await response.json();
      mutate();
      toast.success('Comparison saved');
      return comparison;
    } catch (error) {
      toast.error('Failed to save comparison');
      throw error;
    }
  };

  return {
    comparisons: data || [],
    isLoading,
    isError: error,
    runComparison,
    saveComparison,
    mutate: async () => {
      await mutate();
    },
  };
}