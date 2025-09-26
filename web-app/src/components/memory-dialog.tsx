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

interface MemoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateMemoryData | UpdateMemoryData) => Promise<void>;
  memory?: Memory | null;
  chatId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: string;
  isLoading?: boolean;
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
  initialTitle = '',
  initialContent = '',
  initialCategory = 'personal_info',
  isLoading = false 
}: MemoryDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('personal_info');
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!memory;

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
          <DialogTitle>
            {isEditMode ? 'Edit Memory' : 'Save Memory'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update this memory that NEO will reference in future conversations.'
              : 'Save this information for NEO to remember in future conversations.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid gap-4 py-4">
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
                  {MEMORY_CATEGORIES.map((cat) => (
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
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || !content.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : (isEditMode ? 'Update Memory' : 'Save Memory')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}