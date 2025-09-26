// /components/new-chat-input.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateUUID, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpIcon } from '@/components/icons';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { toast } from 'sonner';

interface ProjectChatInputProps {
  projectId: string;
  projectName: string;
  className?: string;
}

export function ProjectChatInput({ projectId, projectName, className }: ProjectChatInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { width } = useWindowSize();
  
  // Reuse localStorage pattern from ChatInput
  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    `new-chat-input-${projectId}`,
    ''
  );

  // Initialize from localStorage on mount (pattern from ChatInput)
  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
  }, [localStorageInput]);

  // Save to localStorage on input change (pattern from ChatInput)
  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  // Auto-resize textarea logic (reused from ChatInput)
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, []);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '120px';
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const chatId = generateUUID();
    
    try {
      // Navigate to new chat with project context
      const url = `/app/chat/${chatId}?projectId=${projectId}&initialMessage=${encodeURIComponent(input.trim())}`;
      
      // Clear input and localStorage
      setInput('');
      setLocalStorageInput('');
      resetHeight();
      
      // Navigate to the new chat
      router.push(url);
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat. Please try again.');
      setIsLoading(false);
    }
  }, [input, isLoading, projectId, router, setLocalStorageInput, resetHeight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submitForm();
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={`Send a message to start chatting in ${projectName}...`}
            className={cn(
              'min-h-[120px] max-h-[calc(50dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-primary pb-16 pr-14 pl-4 pt-4 dark:border-zinc-700',
              isLoading && 'opacity-50'
            )}
            rows={3}
            disabled={isLoading}
            autoFocus
          />

          {/* Submit button (reusing ChatInput styling) */}
          <div className="absolute bottom-3 right-3">
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-full p-1.5 h-fit border dark:border-zinc-600 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              size="icon"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <ArrowUpIcon size={14} />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Helper text */}
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}