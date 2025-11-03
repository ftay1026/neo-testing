// src/components/memory-chat.tsx
'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Messages } from './messages';
import { ChatInput } from './chat-input';
import { generateUUID } from '@/lib/utils';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCredits } from "@/hooks/use-credits";
import { Button } from './ui/button';

interface MemoryChatProps {
  chatId: string;
  projectId: string;
  projectName: string;
  chatTitle: string;
  initialMessages: Array<UIMessage>;
}

export function MemoryChat({
  chatId,
  projectId,
  projectName,
  chatTitle,
  initialMessages,
}: MemoryChatProps) {
  const { mutate } = useSWRConfig();
  const { mutate: mutateCredits } = useCredits();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    status,
    stop,
    reload,
    error,
  } = useChat({
    id: chatId,
    body: { 
      id: chatId, 
      mode: 'coach', // Fixed mode for memory chat
      projectId, 
      chatSummary: null, 
      parentChatId: null, 
      initialChatTitle: chatTitle 
    },
    initialMessages, // Backend still has full history
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
      mutateCredits();
    },
    onError: (error) => {
      console.log('error in useChat:', error);

      // ERROR ANALYSIS
      const currentMessages = [...messages];
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

          if (error.message.includes('Failed to save')) {
            console.log('Database save failed - removing complete conversation turn');
          } else {
            console.log('Stream interrupted - removing partial AI response');
          }

          setInput(secondLast.content);
          return prevSnapshot.slice(0, -2);
        }

        // SCENARIO 3: Unknown error state
        else {
          console.warn('Unknown error state - no automatic recovery');
          console.log('Message pattern not recognized:', {
            lastRole: last?.role,
            secondLastRole: secondLast?.role,
            messageCount: prevSnapshot.length
          });

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

  // Filter to show only messages from current session (no initial messages)
  const displayMessages = messages.filter(msg => 
    !initialMessages.some(initialMsg => initialMsg.id === msg.id)
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed header with title */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Learning</h2>
      </div>

      {/* Scrollable messages area */}
      <div className="flex-1 overflow-hidden">
        <Messages
          chatId={chatId}
          status={status}
          messages={displayMessages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={false}
          isLogOpen={false}
          isProjectKnowledgeOpen={false}
          isMemoriesOpen={false}
          projectId={projectId}
          closeSideBar={() => {}}
            hideKnowledgeAndLogs={true}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="flex-shrink-0 text-center text-sm text-red-600 mb-2 px-4">
          {error.message.includes('Overloaded') ? (
            <>
              <p>The server is currently overloaded. Please try again later.</p>
              <Button variant="link" onClick={() => reload()}>Try Again</Button>
            </>
          ) : (
            <p>Error: {error.message}</p>
          )}
        </div>
      )}

      {/* Fixed input area */}
      <form className="flex-shrink-0 flex px-4 bg-background pb-4 md:pb-6 gap-2 max-w-3xl mx-auto w-full">
        <ChatInput
          chatId={chatId}
          input={input}
          setInput={setInput}
          mode="coach"
          handleModeChange={() => {}} // No mode switching
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          messages={messages}
          setMessages={setMessages}
          projectId={projectId}
          isMemoryChat={true}
        />
      </form>
    </div>
  );
}