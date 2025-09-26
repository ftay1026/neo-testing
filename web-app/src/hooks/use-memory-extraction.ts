// src/hooks/use-memory-extraction.ts
import { useState } from 'react';
import { toast } from 'sonner';
import type { ExtractedMemory } from '@/types/app.types';
import type { UIMessage } from 'ai';

export function useMemoryExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractMemoryFromMessage = async (
    message: string, 
    previousMessages?: UIMessage[]
  ): Promise<ExtractedMemory | null> => {
    if (!message.trim()) {
      return null;
    }

    setIsExtracting(true);
    try {
      const response = await fetch('/api/memories/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          previousMessages: previousMessages?.slice(-10) // Only send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract memory information');
      }

      const result: ExtractedMemory = await response.json();
      return result;
    } catch (error) {
      console.error('Error extracting memory:', error);
      toast.error('Failed to process message for memory extraction');
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractMemoryFromMessage,
    isExtracting,
  };
}