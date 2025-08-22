// src/hooks/use-memories.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { toast } from 'sonner';
import type { Memory, CreateMemoryData, UpdateMemoryData } from '@/types/app.types';

export function useMemories(initialData?: Memory[]) {
  const { data: memories = [], error, mutate, isLoading } = useSWR<Memory[]>(
    '/api/memories',
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnMount: initialData ? false : true,
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const createMemory = async (memoryData: CreateMemoryData) => {
    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create memory');
      }

      const newMemory: Memory = await response.json();
      
      // Optimistically update the cache
      mutate([newMemory, ...memories], false);
      
      toast.success('Memory saved successfully');
      return newMemory;
    } catch (error) {
      console.error('Error creating memory:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save memory');
      throw error;
    }
  };

  const updateMemory = async (memoryData: UpdateMemoryData) => {
    try {
      const response = await fetch(`/api/memories/${memoryData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: memoryData.title,
          content: memoryData.content,
          category: memoryData.category,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update memory');
      }

      const updatedMemory: Memory = await response.json();

      // Optimistically update the cache
      mutate(
        memories.map(m => m.id === memoryData.id ? updatedMemory : m),
        false
      );
      
      toast.success('Memory updated successfully');
      return updatedMemory;
    } catch (error) {
      console.error('Error updating memory:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update memory');
      throw error;
    }
  };

  const deleteMemories = async (memoryIds: number[]) => {
    try {
      const response = await fetch('/api/memories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memoryIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete memories');
      }

      // Optimistically update the cache
      mutate(
        memories.filter(m => !memoryIds.includes(m.id)),
        false
      );
      
      toast.success(
        memoryIds.length === 1 
          ? 'Memory deleted successfully'
          : `${memoryIds.length} memories deleted successfully`
      );
    } catch (error) {
      console.error('Error deleting memories:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete memories');
      throw error;
    }
  };

  const isError = !!error;

  return {
    memories,
    isLoading,
    isError,
    createMemory,
    updateMemory,
    deleteMemories,
    mutate,
  };
}