'use client';

import { useState } from 'react';
import { BrainIcon, ArrowLeft, ArrowDown } from 'lucide-react';
import { useMemories } from '@/hooks/use-memories';

interface Memory {
  id: number;
  title: string;
  category: string | null;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export function MemoryToggleClient() {
  const [memoriesOpen, setMemoriesOpen] = useState(true);
  
  // Use the hook to fetch memories - no initial data needed
  const { memories, isLoading, isError } = useMemories();

  return (
    <>
      <button
        onClick={() => setMemoriesOpen(!memoriesOpen)}
        className="flex items-center justify-between gap-2 mb-4 w-full hover:bg-accent/50 rounded-md p-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BrainIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <h2 className="text-sm font-medium">See Memory</h2>
        </div>
        
        {memoriesOpen ? (
          <ArrowDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ArrowLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {memoriesOpen && (
        <div className="flex flex-col gap-2 w-full overflow-y-auto scrollbar-custom max-h-[calc(100%-3rem)]">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading memories...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive text-center py-4">
              Failed to load memories
            </div>
          ) : memories.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No memories yet
            </div>
          ) : (
            memories.map((memory) => (
              <div
                key={memory.id}
                className="min-h-12 px-3 py-2 rounded-md border border-muted-foreground/20 bg-background/50 flex-shrink-0 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <p className="text-sm text-foreground line-clamp-2">
                  {memory.title}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}