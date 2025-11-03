'use client';

import { useState } from 'react';
import { BrainIcon, ArrowLeft, ArrowDown, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useMemories } from '@/hooks/use-memories';
import { Badge } from '@/components/ui/badge';
import type { Memory } from '@/types/app.types';

// Category order and display names (same as memories page)
const CATEGORY_ORDER = [
  { key: 'personal_info', label: 'Personal Info' },
  { key: 'goals', label: 'Goals' },
  { key: 'professional', label: 'Professional' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'philosophy', label: 'Philosophy' },
  { key: 'writing_style', label: 'Writing Style' },
  { key: 'preferences', label: 'Preferences' },
] as const;

export function MemoryToggleClient() {
  const [memoriesOpen, setMemoriesOpen] = useState(true);
  
  // Category collapse states - all collapsed by default for compact view
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set([
      "personal_info",
      "writing_style",
      "goals",
      "professional",
      "relationships",
      "philosophy",
      "preferences",
      "uncategorized"
    ])
  );
  
  // Use the hook to fetch memories
  const { memories, isLoading, isError } = useMemories();

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  const getCategoryColor = (category?: string) => {
    const colors = {
      preferences: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      philosophy: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      personal_info: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      writing_style: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      goals: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      relationships: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      professional: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  // Group memories by category
  const memoriesByCategory = CATEGORY_ORDER.reduce((acc, { key }) => {
    acc[key] = memories.filter(m => m.category === key);
    return acc;
  }, {} as Record<string, Memory[]>);

  // Uncategorized memories
  const uncategorizedMemories = memories.filter(
    m => !CATEGORY_ORDER.some(cat => cat.key === m.category)
  );

  return (
    <>
      <button
        onClick={() => setMemoriesOpen(!memoriesOpen)}
        className="flex items-center justify-between gap-2 mb-4 w-full hover:bg-accent/50 rounded-md p-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BrainIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <h2 className="text-sm font-medium">See Memory</h2>
          {memories.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {memories.length}
            </Badge>
          )}
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
            <div className="space-y-2">
              {/* Render categories in order */}
              {CATEGORY_ORDER.map(({ key, label }) => {
                const categoryMemories = memoriesByCategory[key];
                if (categoryMemories.length === 0) return null;

                const isCollapsed = collapsedCategories.has(key);

                return (
                  <div key={key} className="space-y-1">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(key)}
                      className="w-full flex items-center justify-between px-2 py-1.5 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium">{label}</span>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          {categoryMemories.length}
                        </Badge>
                      </div>
                    </button>

                    {/* Category Memories */}
                    {!isCollapsed && (
                      <div className="space-y-1 ml-2 pl-2 border-l border-muted-foreground/20">
                        {categoryMemories.map((memory) => (
                          <div
                            key={memory.id}
                            className="px-2 py-1.5 rounded-md border border-muted-foreground/20 bg-background/50 hover:bg-accent/30 transition-colors cursor-pointer"
                          >
                            <p className="text-xs text-foreground line-clamp-1">
                              {memory.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized memories */}
              {uncategorizedMemories.length > 0 && (
                <div className="space-y-1">
                  <button
                    onClick={() => toggleCategory('uncategorized')}
                    className="w-full flex items-center justify-between px-2 py-1.5 border rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {collapsedCategories.has('uncategorized') ? (
                        <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium">Uncategorized</span>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {uncategorizedMemories.length}
                      </Badge>
                    </div>
                  </button>

                  {!collapsedCategories.has('uncategorized') && (
                    <div className="space-y-1 ml-2 pl-2 border-l border-muted-foreground/20">
                      {uncategorizedMemories.map((memory) => (
                        <div
                          key={memory.id}
                          className="px-2 py-1.5 rounded-md border border-muted-foreground/20 bg-background/50 hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                          <p className="text-xs text-foreground line-clamp-1">
                            {memory.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}