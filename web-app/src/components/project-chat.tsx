// src/components/project-chat.tsx
'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { generateUUID } from '@/lib/utils';
import { toast } from 'sonner';
import { ModeType } from '@/types/app.types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon } from 'lucide-react';
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectChatProps {
  projectId: string;
  projectName: string;
  className?: string;
}

export function ProjectChat({ projectId, projectName, className }: ProjectChatProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ModeType>('coach');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called with mode:', mode);
    
    if (!input.trim()) return;

    const chatId = generateUUID();
    
    // Simple: Just navigate with the message in URL params
    const encodedMessage = encodeURIComponent(input.trim());
    setInput(''); // Clear input after submission
    router.push(`/app/chat/${chatId}?projectId=${projectId}&initialMessage=${encodedMessage}&mode=${mode}`);
    
  }, [input, projectId, router, mode]);

  const handleModeChange = (newMode: ModeType) => {
    console.log('handleModeChange called with new mode:', newMode);
    setMode(newMode);
  };

  console.log('ProjectChat rendered with mode:', mode);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative w-full flex flex-col gap-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Send a message to start chatting in ${projectName}...`}
          className='min-h-[120px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-16 pr-14 pl-4 pt-4 dark:border-zinc-700'
          rows={3}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="absolute bottom-3 w-full">
          <div className="flex flex-row gap-2 items-center justify-between px-3">
            <div className="w-fit">
              <ModeButton
                mode={mode}
                handleModeChange={handleModeChange}
              />
            </div>

            <div className="w-fit">
              <SendButton
                input={input}
                submitForm={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// Mode button to switch between coach, and assistant modes in system prompt
const PureModeButton = ({mode, handleModeChange}: {mode: ModeType; handleModeChange: (mode: ModeType) => void}) => {
  const handleToggleChange = () => {
    const newMode = mode === 'assistant' ? 'coach' : 'assistant';
    handleModeChange(newMode);
  };
  const modes = [
    { value: 'assistant', label: 'Assistant' },
    { value: 'coach', label: 'Coach' },
  ];
  
  return (
    <div className='flex items-center gap-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Toggle
              className='h-8 w-fit cursor-pointer'
              aria-label='Toggle Coaching Mode'
              pressed={mode === 'coach'}
              onPressedChange={handleToggleChange}
            >
              <span className='text-xs'>
                { mode === 'coach' ? 'C' : 'C' }
              </span>
            </Toggle>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Coaching Mode</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

const ModeButton = memo(PureModeButton, (prevProps, nextProps) => {
  if (prevProps.mode !== nextProps.mode) return false;
  return true;
});

function PureSendButton({
  submitForm,
  input,
}: {
  submitForm: () => void;
  input: string;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 bg-secondary text-secondary-foreground hover:bg-secondary/90 cursor-pointer"
      type='submit'
      disabled={input.length === 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  return true;
});