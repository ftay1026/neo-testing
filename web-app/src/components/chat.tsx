// src/components/chat.tsx
'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { ChatHeader } from '@/components/chat-header';
import { Messages } from './messages';
import { ChatInput } from './chat-input';
import { generateUUID } from '@/lib/utils';
import { toast } from 'sonner';
import { VisibilityType, ModeType } from '@/types/app.types';
import { useSWRConfig } from 'swr';
import { useCredits } from "@/hooks/use-credits";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { BookCopyIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';

interface ChatProps {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  projectId?: string;
  projectName?: string;
  chatTitle?: string;
  initialMode?: ModeType;
  isNewChat?: boolean;
  newMessage?: UIMessage | null;
  parentChatId?: string | null;
  chatSummary?: string | null;
  parentChatTitle?: string | null;
}

export function Chat({
  id,
  initialMessages,
  selectedVisibilityType,
  isReadonly,
  projectId,
  projectName,
  chatTitle: initialChatTitle,
  initialMode = 'coach',
  isNewChat = false,
  newMessage = null,
  parentChatId = null,
  chatSummary = null,
  parentChatTitle = null,
}: ChatProps) {
  const { mutate } = useSWRConfig();
  const { mutate: mutateCredits } = useCredits();

  const [mode, setMode] = useState<ModeType>(initialMode);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [chatTitle, setChatTitle] = useState(initialChatTitle || 'Untitled');
  const autoSubmitRef = useRef(false);

  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode);
  };

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    status,
    stop,
    reload,
    append,
    data,
  } = useChat({
    id,
    body: { id, mode, projectId, chatSummary, parentChatId, initialChatTitle },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
      mutateCredits();

      // Clean up URL after first message if this was a new chat
      if (isNewChat) {
        const url = new URL(window.location.href);
        url.searchParams.delete('initialMessage');
        url.searchParams.delete('projectId');
        url.searchParams.delete('mode');
        url.searchParams.delete('parentChatId');
        url.searchParams.delete('inherit');
        window.history.replaceState({}, '', url.pathname);
      }
    },
    onError: (error) => {
      // setIsResuming(false);
      console.log('error in useChat:', error)
      if (error.message.includes('Insufficient credits')) {
        toast.error('You have run out of credits. Please purchase more credits to continue.');
      } else if (error.message.includes('Customer record not found')) {
        toast.error('Please make a purchase to start using the chat.');
      } else {
        toast.error('An error occurred. Please try again later.');
      }
      mutateCredits();
    },
  });

  // Update chat title if data stream provides a title update
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const titleUpdate = data.find((item): item is { type: string; title: string } => 
        typeof item === 'object' && 
        item !== null && 
        'type' in item && 
        'title' in item &&
        (item as any).type === 'title-update' &&
        typeof (item as any).title === 'string'
      );

      console.log('Title update from data stream:', titleUpdate);
      if (titleUpdate && 'title' in titleUpdate && typeof titleUpdate.title === 'string') {
        setChatTitle(titleUpdate.title);
      }
    }
  }, [data]);

  // Replace the auto-submit useEffect in /components/chat.tsx

  useEffect(() => {
    if (autoSubmitRef.current) {
      console.log('⏭️ Skipping duplicate useEffect execution');
      return;
    }

    console.log('🔄 useEffect EXECUTION COUNT for auto-submit');
    console.log('Current time:', new Date().toISOString());

    console.log('Auto-submit effect running:', {
      isNewChat,
      newMessage,
      messagesLength: messages.length,
      firstMessageRole: messages[0]?.role,
      status,
      hasAutoSubmitted
    });

    if (isNewChat && 
        newMessage &&
        newMessage.role === 'user' && 
        status === 'ready' && 
        !hasAutoSubmitted) {
      
      console.log('Auto-submitting new chat message');
      console.log('User message:', newMessage.content);
      
      console.log('🚀 APPENDING MESSAGE - Execution time:', new Date().toISOString());
      autoSubmitRef.current = true; // Mark as executed
      setHasAutoSubmitted(true);
      
      // Instead of trying to submit the form, just append the message
      // This will trigger the AI response directly
      append({
        id: newMessage.id,
        role: 'user',
        content: newMessage.content,
        createdAt: newMessage.createdAt
      });
    }
  }, [isNewChat, newMessage, status, hasAutoSubmitted, append]);

  // Reset ref when component unmounts or chat changes
  useEffect(() => {
    return () => {
      autoSubmitRef.current = false;
    };
  }, [id]);

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId={id}
        selectedVisibilityType={selectedVisibilityType}
        isReadonly={false}
        projectId={projectId}
        projectName={projectName}
        chatTitle={chatTitle}
      />

      {/* Simple Inheritance Icon - Only shows when parentChatId exists */}
      {parentChatId && (
        <div className='flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl'>
          <div className="">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/app/chat/${parentChatId}?mode=${mode}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <BookCopyIcon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to: {parentChatTitle || 'Previous conversation'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      <Messages
        chatId={id}
        status={status}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={false}
      />

      <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        {!isReadonly && (
          <ChatInput
            chatId={id}
            input={input}
            setInput={setInput}
            mode={mode}
            handleModeChange={handleModeChange}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            messages={messages}
            setMessages={setMessages}
            projectId={projectId}
          />
        )}
      </form>
    </div>
  );
}