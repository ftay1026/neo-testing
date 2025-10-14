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
  MessageSquareIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
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

interface MemoriesClientProps {
  initialMemories: Memory[];
  user: User;
}

export function MemoriesClient({ initialMemories, user }: MemoriesClientProps) {
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
  // For Saving new Memory
  const [chatId, setChatId] = useState<string>('');

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

  const selectAll = () => {
    setSelectedMemories(memories.map(m => m.id));
  };

  const clearSelection = () => {
    setSelectedMemories([]);
    setIsSelectionMode(false);
  };

  const getCategoryColor = (category?: string) => {
    const colors = {
      preferences: 'bg-blue-100 text-blue-800',
      philosophy: 'bg-purple-100 text-purple-800',
      personal_info: 'bg-green-100 text-green-800',
      writing_style: 'bg-orange-100 text-orange-800',
      goals: 'bg-yellow-100 text-yellow-800',
      relationships: 'bg-pink-100 text-pink-800',
      professional: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Only show loading if we're refetching and have no data
  if (isLoading && memories.length === 0) {
    return <MemoriesLoadingSkeleton />;
  }

  if (isError && memories.length === 0) {
    return <MemoriesErrorState onCreateMemory={handleCreateMemory} />;
  }

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
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

        {/* Main content */}
        <div className="flex-1 p-6 mx-auto max-w-7xl">
          {memories.length === 0 ? (
            <MemoriesEmptyState onCreateFirst={handleCreateMemory} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memories.map((memory) => (
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
      </div>

      {/* Dialogs */}
      <MemoryDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveMemory}
        memory={editingMemory}
        chatId={undefined} // Will be provided when creating from chat
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
              <div className="flex items-center gap-2">
                {memory.category && (
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(memory.category)}`}>
                    {memory.category.replace('_', ' ')}
                  </Badge>
                )}
              </div>
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
            className="text-sm text-muted-foreground mb-4 line-clamp-3 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => !isSelectionMode && onEdit(memory)}
          >
            {memory.content}
          </div>
          {/* Removed the time of last update and project and chat name */}
          {/* <div className="flex items-center justify-between text-xs text-muted-foreground">
           <p>
              {formatDistanceToNow(new Date(memory.updated_at), { addSuffix: true })}
            </p>
             <div className="flex items-center gap-1">
              <MessageSquareIcon className="w-3 h-3" />
              {memory.chat_id ? (
              <Link
                href={`/app/chat/${memory.chat_id}`}
                className="hover:text-foreground transition-colors"
              >
                {memory.chats?.title || 'View chat'}
              </Link>
              ) : (
                <span className="italic text-xs text-muted-foreground">{memory.chats?.title || 'No associated chat'}</span>
              )}
            </div> 
          </div> */}
        </CardContent>
      </div>
    </Card>
  );
}

function MemoriesEmptyState({ onCreateFirst }: { onCreateFirst: () => void }) {
  return (
    <div className="flex items-center justify-center flex-1">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <BrainIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">No memories yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Save important information for NEO to remember in future conversations from your chats.
          </p>
          {/* <Button onClick={onCreateFirst}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Your First Memory
          </Button> */}
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
          {/* <Button size="sm" disabled>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Memory
          </Button> */}
        </div>
      </div>

      <div className="flex-1 p-6 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
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
          {/* <Button size="sm" onClick={onCreateMemory}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Memory
          </Button> */}
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