// src/components/memory-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Memory, CreateMemoryData, UpdateMemoryData } from '@/types/app.types';
import { getChatsByProjectId, getUser, getUserProjects } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

interface MemoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateMemoryData | UpdateMemoryData) => Promise<void>;
  memory?: Memory | null;
  chatId?: string;
  setChatId?: (id: string) => void;
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: string;
  isLoading?: boolean;
  showProjectAndChatSelector?: boolean;
}

const MEMORY_CATEGORIES = [
  { value: 'preferences', label: 'Preferences' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'personal_info', label: 'Personal Info' },
  { value: 'writing_style', label: 'Writing Style' },
  { value: 'goals', label: 'Goals' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'professional', label: 'Professional' },
];

export function MemoryDialog({
  isOpen,
  onOpenChange,
  onSave,
  memory,
  chatId,
  setChatId,
  initialTitle = '',
  initialContent = '',
  initialCategory = 'personal_info',
  isLoading = false,
  showProjectAndChatSelector = false,
}: MemoryDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('personal_info');
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>('');

  const isEditMode = !!memory;


  // Add state for supabase client and user
  const [supabase, setSupabase] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // 🔹 Initialize Supabase client and user once on mount
  useEffect(() => {
    (async () => {
      try {
        const client = await createClient();
        const userData = await getUser(client);
        setSupabase(client);
        setUser(userData);
      } catch (err) {
        console.error('Error initializing Supabase:', err);
      }
    })();
  }, []); // Empty dependency array - runs only once

  // 🔹 Fetch projects only if the selector is visible and supabase is ready
  useEffect(() => {
    if (showProjectAndChatSelector && isOpen && supabase) {
      (async () => {
        try {
          const userProjects = await getUserProjects(supabase);
          setProjects(userProjects);
        } catch (err) {
          console.error('Error fetching projects:', err);
        }
      })();
    }
  }, [isOpen, showProjectAndChatSelector, supabase]); // Add supabase to dependencies

  // 🔹 When project changes → fetch its chats
  useEffect(() => {
    if (selectedProject && supabase) {
      (async () => {
        try {
          const projectChats = await getChatsByProjectId(supabase, selectedProject);
          setChats(projectChats);
        } catch (err) {
          console.error('Error fetching chats:', err);
        }
      })();
    } else {
      setChats([]);
      setSelectedChat('');
    }
  }, [selectedProject, supabase]); // Add supabase to dependencies

  // Reset form when dialog opens/closes or memory changes
  useEffect(() => {
    if (isOpen) {
      setTitle(memory?.title || initialTitle);
      setContent(memory?.content || initialContent);
      setCategory(memory?.category || initialCategory);
    } else {
      setTitle('');
      setContent('');
      setCategory('personal_info');
    }
  }, [isOpen, memory, initialTitle, initialContent, initialCategory]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    console.log("saving the memory")

    if (!isEditMode && !chatId) {
      return;
    }


    setIsSaving(true);
    try {
      if (isEditMode && memory) {
        await onSave({
          id: memory.id,
          title: title.trim(),
          content: content.trim(),
          category: category,
        });
      } else {
        await onSave({
          title: title.trim(),
          content: content.trim(),
          category: category,
          chat_id: chatId!,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditMode ? 'Edit Memory' : 'Save Memory'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update this memory that NEO will reference in future conversations.'
              : 'Save this information for NEO to remember in future conversations.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid gap-4 py-4">
            {/* Optional Project & Chat Selectors */}
            {showProjectAndChatSelector && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Selector */}
                <div className="grid gap-2 w-full">
                  <Label>Project</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-full py-2 h-11 text-base">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent className="w-full max-w-[300px]">
                      {projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chat Selector */}
                <div className="grid gap-2 w-full">
                  <Label>Chat</Label>
                  <Select
                    value={selectedChat}
                    onValueChange={(value) => {
                      setSelectedChat(value);
                      setChatId?.(value);
                    }}
                    disabled={isSaving || !selectedProject}
                  >
                    <SelectTrigger className="w-full py-2 h-11 text-base">
                      <SelectValue
                        placeholder={
                          selectedProject ? 'Select a chat' : 'Select a project first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="w-full max-w-[300px]">
                      {chats.map((chat) => (
                        <SelectItem key={chat.id} value={chat.id}>
                          {chat.title || 'Untitled Chat'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            )}


            {/* Memory Fields */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of what to remember..."
                disabled={isSaving}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSaving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'preferences', label: 'Preferences' },
                    { value: 'philosophy', label: 'Philosophy' },
                    { value: 'personal_info', label: 'Personal Info' },
                    { value: 'writing_style', label: 'Writing Style' },
                    { value: 'goals', label: 'Goals' },
                    { value: 'relationships', label: 'Relationships' },
                    { value: 'professional', label: 'Professional' },
                  ].map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 flex-1">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What should NEO remember about you..."
                className="min-h-[200px] resize-y"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update Memory' : 'Save Memory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}