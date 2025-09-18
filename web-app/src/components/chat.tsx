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
  isNewChat?: boolean; // Optional prop to indicate if this is a new chat
  newMessage?: UIMessage | null; // Optional prop for new message
  parentChatId?: string | null; // Optional parent chat ID
  chatSummary?: string | null; // Optional chat summary
  parentChatTitle?: string | null; // Optional parent chat title
  isDefaultProject?: boolean; // Optional prop to indicate if this is the default project
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
  isNewChat = false, // Default to false if not provided
  newMessage = null, // Default to null if not provided
  parentChatId = null, // Optional parent chat ID
  chatSummary = null, // Optional chat summary
  parentChatTitle = null, // Optional parent chat title
  isDefaultProject = false, // Optional prop to indicate if this is the default project
}: ChatProps) {
  const { mutate } = useSWRConfig();
  const { mutate: mutateCredits } = useCredits();

  const [mode, setMode] = useState<ModeType>(initialMode);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [chatTitle, setChatTitle] = useState(initialChatTitle || 'Untitled');
  const autoSubmitRef = useRef(false);
  const [clientNewMessage, setClientNewMessage] = useState<UIMessage | null>(null);

  // Handle localStorage retrieval on client-side
  useEffect(() => {
    if (isNewChat && typeof window !== 'undefined') {
      try {
        const storedMessage = localStorage.getItem(`initial-message-${id}`);
        const storedMode = localStorage.getItem(`initial-mode-${id}`) as ModeType;
        
        if (storedMessage) {
          // Clean up localStorage immediately
          localStorage.removeItem(`initial-message-${id}`);
          localStorage.removeItem(`initial-mode-${id}`);
          
          // Set the mode if it was stored
          if (storedMode) {
            setMode(storedMode);
          }
          
          // Create the message object
          const messageObj: UIMessage = {
            id: generateUUID(),
            role: 'user',
            content: storedMessage,
            parts: [{ type: 'text', text: storedMessage }],
            createdAt: new Date(),
            experimental_attachments: [],
          };
          
          setClientNewMessage(messageObj);
          
          console.log('Retrieved message from localStorage:', storedMessage.substring(0, 100) + '...');
        }
      } catch (error) {
        console.error('Error retrieving initial message from localStorage:', error);
        toast.error('Failed to load initial message');
      }
    }
  }, [id, isNewChat]);

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
    error,
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

      // Hint: data is undefined in the onFinish callback because it's still being processed

      // Clean up URL after first message if this was a new chat
      if (isNewChat) {
        const url = new URL(window.location.href);
        url.searchParams.delete('hasInitialMessage');
        url.searchParams.delete('projectId');
        url.searchParams.delete('mode');
        url.searchParams.delete('parentChatId');
        url.searchParams.delete('inherit');
        window.history.replaceState({}, '', url.pathname);
      }
    },
    onError: (error) => {
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

  // Auto-submit effect - now using clientNewMessage from localStorage
  useEffect(() => {
    if (autoSubmitRef.current) {
      console.log('⏭️ Skipping duplicate useEffect execution');
      return;
    }

    console.log('🔄 useEffect EXECUTION COUNT for auto-submit');
    console.log('Current time:', new Date().toISOString());

    console.log('Auto-submit effect running:', {
      isNewChat,
      hasClientNewMessage: !!clientNewMessage,
      messagesLength: messages.length,
      firstMessageRole: messages[0]?.role,
      status,
      hasAutoSubmitted
    });

    if (isNewChat && 
        clientNewMessage &&
        clientNewMessage.role === 'user' && 
        status === 'ready' && 
        !hasAutoSubmitted) {
      
      console.log('Auto-submitting new chat message');
      console.log('User message:', clientNewMessage.content);
      
      console.log('🚀 APPENDING MESSAGE - Execution time:', new Date().toISOString());
      autoSubmitRef.current = true;
      setHasAutoSubmitted(true);
      
      // Append the message to trigger AI response
      append({
        id: clientNewMessage.id,
        role: 'user',
        content: clientNewMessage.content,
        createdAt: clientNewMessage.createdAt
      });
    }
  }, [isNewChat, clientNewMessage, status, hasAutoSubmitted, append]);

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
        isDefaultProject={isDefaultProject}
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

      {
        error && (
          <div className="text-center text-sm text-red-600 mb-2">
            {error.message.includes('Overloaded') ? (
              <>
              <p>The server is currently overloaded. Please try again later.</p>
              <Button variant="link" onClick={() => reload()}>Try Again</Button>
              </>
            ) : (
              <p>Error: {error.message}</p>
            )}
          </div>
        )
      }

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