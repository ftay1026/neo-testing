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
import { BookCopyIcon, BookOpenText, School, BrainIcon, MessageSquarePlus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';
import { useSidebar } from './ui/sidebar';
import { MemoryChat } from './memory-chat';

 interface MemoryChatDetails{
  MemoryChatId: string;
  projectId: string;
  projectName: string;
  chatTitle: string;
  initialMessages: UIMessage[];
 }

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
  memoryChatDetails: MemoryChatDetails; // Optional memory chat details
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
  memoryChatDetails,
}: ChatProps) {
  const { mutate } = useSWRConfig();
  const { mutate: mutateCredits } = useCredits();
  const { open } = useSidebar();


  const [mode, setMode] = useState<ModeType>(initialMode);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [chatTitle, setChatTitle] = useState(initialChatTitle || 'Untitled');
  const autoSubmitRef = useRef(false);
  const [clientNewMessage, setClientNewMessage] = useState<UIMessage | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [projectKnowledgeOpen, setProjectKnowledgeOpen] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false); 

    // Add state to control MemoryChat visibility
  const [showMemoryChat, setShowMemoryChat] = useState(false);

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

  const closeSideBarHandler = () => {
    logOpen && setLogOpen(!logOpen);
    projectKnowledgeOpen && setProjectKnowledgeOpen(!projectKnowledgeOpen);
  }

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

      // ERROR ANALYSIS
      const currentMessages = [...messages]; // Create snapshot
      const lastMessage = currentMessages[currentMessages.length - 1];
      const secondLastMessage = currentMessages[currentMessages.length - 2];

      console.log('Error state analysis:', {
        errorMessage: error.message,
        totalMessages: currentMessages.length,
        lastMessageRole: lastMessage?.role,
        lastMessageContent: lastMessage?.content?.substring(0, 50) + '...',
        secondLastMessageRole: secondLastMessage?.role,
        currentInput: input,
        status: status
      });

      // SCENARIO-BASED ERROR HANDLING
      setMessages(prev => {
        const prevSnapshot = [...prev];
        const last = prevSnapshot[prevSnapshot.length - 1];
        const secondLast = prevSnapshot[prevSnapshot.length - 2];

        // SCENARIO 1: Stream failed before AI response
        if (last?.role === 'user') {
          console.log('Scenario 1: Stream failed before AI response');
          setInput(last.content);
          return prevSnapshot.slice(0, -1);
        }

        // SCENARIO 2: Stream failed during AI response OR save failed after completion
        else if (last?.role === 'assistant' && secondLast?.role === 'user') {
          console.log('Scenario 2: Stream failed during/after AI response');

          // Check if this was a database save error vs streaming error
          if (error.message.includes('Failed to save')) {
            console.log('Database save failed - removing complete conversation turn');
          } else {
            console.log('Stream interrupted - removing partial AI response');
          }

          setInput(secondLast.content);
          return prevSnapshot.slice(0, -2); // Remove both user and AI messages
        }

        // SCENARIO 3: Unknown error state
        else {
          console.warn('Unknown error state - no automatic recovery');
          console.log('Message pattern not recognized:', {
            lastRole: last?.role,
            secondLastRole: secondLast?.role,
            messageCount: prevSnapshot.length
          });

          // Don't modify messages in unknown state
          return prevSnapshot;
        }
      });

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

        {/* MemoryChat - Small floating chat box */}
      {showMemoryChat && (
        <div
          className="absolute w-[20%] min-w-[400px] hidden xl:block border-2 border-white bg-background rounded-lg overflow-hidden shadow-2xl"
          style={{
            left: '22%',
            bottom: '20%', // Above the input area
            transform: 'translateX(-50%)',
            height: '500px',
            zIndex: 9999,
          }}
        >
          <MemoryChat
            chatId={memoryChatDetails.MemoryChatId}
            chatTitle={memoryChatDetails.chatTitle}
            projectName={memoryChatDetails.projectName}
            projectId={memoryChatDetails.projectId}
            initialMessages={memoryChatDetails.initialMessages}
          />
        </div>
      )}
      
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
      <div className=" flex-row justify-start items-start flex flex-1 h-full overflow-hidden">
        <Messages
          chatId={id}
          status={status}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={false}
          isLogOpen={logOpen}
          isProjectKnowledgeOpen={projectKnowledgeOpen}
          isMemoriesOpen={memoriesOpen}
          projectId={projectId}
          closeSideBar={closeSideBarHandler}
          hideKnowledgeAndLogs={false}
        />
      </div>

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
      <div className='flex justify-center min-w-0 '>
      
          <div className=" flex-col justify-center items-center space-y-3 mr-1 hidden xl:flex">
        {/*Memories Toggle Button */}
        <div className="flex items-start -mt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 bg-[#18181b] rounded-full flex flex-col items-center justify-center ${memoriesOpen ? 'bg-accent' :''}`}
                onClick={() => setMemoriesOpen(!memoriesOpen)}
              >
                <BrainIcon className='size-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {memoriesOpen ? "Close Memories" : "Open Memories"}
            </TooltipContent>
          </Tooltip>
        </div>
         {/* Memory Chat Toggle Button*/}
        <div className="mb-8 ">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 bg-[#18181b] pt-0.5 rounded-full flex flex-col items-center justify-center ${showMemoryChat ? 'bg-accent': ''}`}
                onClick={() => setShowMemoryChat(!showMemoryChat)}
              >
                <MessageSquarePlus className='size-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {showMemoryChat ? "Close Memory Chat" : "Open Memory Chat"}
            </TooltipContent>
          </Tooltip>
        </div>
        </div>

        <form className={`flex px-1.5 bg-background pb-4 md:pb-6 gap-2 min-w-0 flex-1 max-w-3xl ${!open ? "min-[1500px]:max-w-3xl min-[1280px]:max-w-[50%]" : "max-w-3xl min-[1500px]:max-w-[50%] min-[1800px]:max-w-3xl"
          }`}>
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
        <div className="flex flex-col justify-center items-center space-y-3 ml-1">
        {/*Knowledge Toggle Button */}
        <div className="flex items-start -mt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 bg-[#18181b] rounded-full flex flex-col items-center justify-center ${projectKnowledgeOpen ? 'bg-accent' :''}`}
                onClick={() => setProjectKnowledgeOpen(!projectKnowledgeOpen)}
              >
                <School className='size-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {projectKnowledgeOpen ? "Close Knowledge" : "Open Knowledge"}
            </TooltipContent>
          </Tooltip>
        </div>
         {/* Log Toggle Button*/}
        <div className="mb-8 ">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 bg-[#18181b] pt-0.5 rounded-full flex flex-col items-center justify-center ${logOpen ? 'bg-accent': ''}`}
                onClick={() => setLogOpen(!logOpen)}
              >
                <BookOpenText className='size-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {logOpen ? "Close Logs" : "Open Logs"}
            </TooltipContent>
          </Tooltip>
        </div>
        </div>
      </div>


    </div>
  );
}


