// src/components/memories-client.tsx
'use client';

import { useState } from 'react';
import { ChatHeader } from "@/components/chat-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  BrainIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useMemories } from '@/hooks/use-memories';
import { MemoryDialog } from '@/components/memory-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@supabase/supabase-js';
import type { Memory, CreateMemoryData, UpdateMemoryData } from '@/types/app.types';
import { UIMessage } from 'ai';
import { MemoryChat } from './memory-chat';

interface MemoriesClientProps {
  initialMemories: Memory[];
  user: User;
  MemoryChatId: string;
  projectId: string;
  projectName: string;
  chatTitle: string;
  initialMessages: UIMessage[];
}

// Category order and display names
const CATEGORY_ORDER = [
  { key: 'personal_info', label: 'Personal Info' },
  { key: 'goals', label: 'Goals' },
  { key: 'professional', label: 'Professional' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'philosophy', label: 'Philosophy' },
  { key: 'writing_style', label: 'Writing Style' },
  { key: 'preferences', label: 'Preferences' },
] as const;

export function MemoriesClient({ 
  initialMemories, 
  user, 
  MemoryChatId, 
  projectId, 
  projectName, 
  chatTitle, 
  initialMessages 
}: MemoriesClientProps) {
  const {
    memories,
    isLoading,
    isError,
    createMemory,
    updateMemory,
    deleteMemories
  } = useMemories(initialMemories);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<number | null>(null);

  // Selection states
  const [selectedMemories, setSelectedMemories] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Category collapse states - all open by default
const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
  new Set([
    "writing_style",
    "goals",
    "professional",
    "relationships",
    "philosophy",
    "preferences",
  ])
);
  const handleCreateMemory = () => {
    setEditingMemory(null);
    setIsDialogOpen(true);
  };

  const handleEditMemory = (memory: Memory) => {
    setEditingMemory(memory);
    setIsDialogOpen(true);
  };

  const handleSaveMemory = async (data: CreateMemoryData | UpdateMemoryData) => {
    if ('id' in data) {
      await updateMemory(data);
    } else {
      await createMemory(data);
    }
  };

  const handleDeleteMemory = async () => {
    const idsToDelete = memoryToDelete ? [memoryToDelete] : selectedMemories;
    if (idsToDelete.length > 0) {
      await deleteMemories(idsToDelete);
      setShowDeleteConfirm(false);
      setMemoryToDelete(null);
      setSelectedMemories([]);
    }
  };

  const toggleSelection = (memoryId: number) => {
    setSelectedMemories(prev =>
      prev.includes(memoryId)
        ? prev.filter(id => id !== memoryId)
        : [...prev, memoryId]
    );
  };

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

  const selectAll = () => {
    setSelectedMemories(memories.map(m => m.id));
  };

  const clearSelection = () => {
    setSelectedMemories([]);
    setIsSelectionMode(false);
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

  // Only show loading if we're refetching and have no data
  if (isLoading && memories.length === 0) {
    return <MemoriesLoadingSkeleton />;
  }

  if (isError && memories.length === 0) {
    return <MemoriesErrorState onCreateMemory={handleCreateMemory} />;
  }

  return (
    <>
      <div className="flex flex-col min-w-0 bg-background h-screen">
        <ChatHeader
          chatId="memories"
          selectedVisibilityType="private"
          isReadonly={true}
        />
        
        {/* Header section */}
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto max-w-7xl py-6 px-6">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BrainIcon className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg font-semibold">Memories</h1>
              </div>

              {/* Selection indicator */}
              {isSelectionMode && selectedMemories.length > 0 && (
                <div className="flex items-center gap-2 ml-4">
                  <div className="h-1 w-1 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    {selectedMemories.length} selected
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {isSelectionMode ? (
                  <>
                    {selectedMemories.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      disabled={selectedMemories.length === memories.length}
                    >
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    {memories.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSelectionMode(true)}
                      >
                        Select
                      </Button>
                    )}
                    <Button size="sm" onClick={handleCreateMemory}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      New Memory
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-1 flex-row justify-center xl:overflow-y-hidden'>
          {/* Memory Chat */}
          <div className='hidden xl:block w-full min-w-0 max-w-3xl flex-1 overflow-hidden'>
            <MemoryChat
              chatId={MemoryChatId}
              projectId={projectId}
              projectName={projectName}
              chatTitle={chatTitle}
              initialMessages={initialMessages}
            />
          </div>

          {/* Main content - Memory Cards by Category */}
          <div className='flex-1 p-1 xl:w-[25%] xl:max-w-96 xl:overflow-y-auto scrollbar-custom'>
            {memories.length === 0 ? (
              <MemoriesEmptyState onCreateFirst={handleCreateMemory} />
            ) : (
              <div className="space-y-4 p-4">
                {/* Render categories in order */}
                {CATEGORY_ORDER.map(({ key, label }) => {
                  const categoryMemories = memoriesByCategory[key];
                  if (categoryMemories.length === 0) return null;

                  const isCollapsed = collapsedCategories.has(key);

                  return (
                    <div key={key} className="space-y-2">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(key)}
                        className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                          )}
                          <h3 className="font-medium text-sm">{label}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {categoryMemories.length}
                          </Badge>
                        </div>
                      </button>

                      {/* Category Memories */}
                      {!isCollapsed && (
                        <div className="gap-2 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 ml-2">
                          {categoryMemories.map((memory) => (
                            <MemoryCard
                              key={memory.id}
                              memory={memory}
                              isSelected={selectedMemories.includes(memory.id)}
                              isSelectionMode={isSelectionMode}
                              onToggleSelection={() => toggleSelection(memory.id)}
                              onEdit={handleEditMemory}
                              onDelete={(id) => {
                                setMemoryToDelete(id);
                                setShowDeleteConfirm(true);
                              }}
                              getCategoryColor={getCategoryColor}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Uncategorized memories */}
                {uncategorizedMemories.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleCategory('uncategorized')}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {collapsedCategories.has('uncategorized') ? (
                          <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                        <h3 className="font-medium text-sm">Uncategorized</h3>
                        <Badge variant="secondary" className="text-xs">
                          {uncategorizedMemories.length}
                        </Badge>
                      </div>
                    </button>

                    {!collapsedCategories.has('uncategorized') && (
                      <div className="space-y-2 ml-2">
                        {uncategorizedMemories.map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            isSelected={selectedMemories.includes(memory.id)}
                            isSelectionMode={isSelectionMode}
                            onToggleSelection={() => toggleSelection(memory.id)}
                            onEdit={handleEditMemory}
                            onDelete={(id) => {
                              setMemoryToDelete(id);
                              setShowDeleteConfirm(true);
                            }}
                            getCategoryColor={getCategoryColor}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <MemoryDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveMemory}
        memory={editingMemory}
        chatId={undefined}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteMemory}
        count={memoryToDelete ? 1 : selectedMemories.length}
      />
    </>
  );
}

// Supporting components
function MemoryCard({
  memory,
  isSelected,
  isSelectionMode,
  onToggleSelection,
  onEdit,
  onDelete,
  getCategoryColor
}: {
  memory: Memory;
  isSelected: boolean;
  isSelectionMode: boolean;
  onToggleSelection: () => void;
  onEdit: (memory: Memory) => void;
  onDelete: (id: number) => void;
  getCategoryColor: (category?: string) => string;
}) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 relative">
      {isSelectionMode && (
        <div className="absolute top-4 left-4 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="bg-background shadow-sm"
          />
        </div>
      )}

      <div className={`transition-all duration-200 ${isSelectionMode ? 'pl-12' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle
                className="text-base font-medium line-clamp-1 cursor-pointer hover:text-primary transition-colors group-hover:text-primary mb-2"
                onClick={() => !isSelectionMode && onEdit(memory)}
              >
                {memory.title}
              </CardTitle>
              {memory.category && (
                <Badge variant="outline" className={`text-xs ${getCategoryColor(memory.category)}`}>
                  {memory.category.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {!isSelectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-2"
                  >
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(memory)}>
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(memory.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            className="text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => !isSelectionMode && onEdit(memory)}
          >
            {memory.content}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function MemoriesEmptyState({ onCreateFirst }: { onCreateFirst: () => void }) {
  return (
    <div className="flex items-center justify-center h-full border flex-1">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <BrainIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">No memories yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Save important information for NEO to remember in future conversations from your chats.
          </p>
        </div>
      </div>
    </div>
  );
}

function MemoriesLoadingSkeleton() {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId="memories"
        selectedVisibilityType="private"
        isReadonly={true}
      />

      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto max-w-7xl py-6 px-6">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Memories</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 mx-auto max-w-7xl">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoriesErrorState({ onCreateMemory }: { onCreateMemory: () => void }) {
  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId="memories"
        selectedVisibilityType="private"
        isReadonly={true}
      />

      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto max-w-7xl py-6 px-6">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Memories</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center flex-1">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <BrainIcon className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-medium">Failed to load memories</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please refresh the page to try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  count
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {count} memor{count > 1 ? 'ies' : 'y'}.
            This action cannot be undone and NEO will no longer remember this information.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}