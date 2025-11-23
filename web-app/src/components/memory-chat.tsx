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
import { PlusIcon, TrashIcon } from 'lucide-react';

interface MemoryChatProps {
  chatId: string;
  projectId: string;
  projectName: string;
  chatTitle: string;
  initialMessages: Array<UIMessage>;
  // Optional props for action buttons
  isSelectionMode?: boolean;
  setIsSelectionMode?: (value: boolean) => void;
  selectedMemories?: number[];
  memoriesCount?: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onCreateMemory?: () => void;
}

export function MemoryChat({
  chatId,
  projectId,
  projectName,
  chatTitle,
  initialMessages,
  // Destructure new props
  isSelectionMode,
  setIsSelectionMode,
  selectedMemories,
  memoriesCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onCreateMemory,
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
      mode: 'coach',
      projectId, 
      chatSummary: null, 
      parentChatId: null, 
      initialChatTitle: chatTitle 
    },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
      mutateCredits();
    },
    onError: (error) => {
      // ... your error handling code remains the same ...
    },
  });

  const displayMessages = messages.filter(msg => 
    !initialMessages.some(initialMsg => initialMsg.id === msg.id)
  );

  // Check if action buttons should be shown
  const showActionButtons = onCreateMemory !== undefined;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Updated header with title AND optional action buttons */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Learning</h2>
        
        {/* Action buttons - only shown when props are provided */}
        {showActionButtons && (
          <div className="flex items-center gap-2">
            {isSelectionMode ? (
              <>
                {selectedMemories && selectedMemories.length > 0 && onDeleteSelected && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteSelected}
                  >
                    <TrashIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                )}
                {onSelectAll && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSelectAll}
                    disabled={selectedMemories?.length === memoriesCount}
                    className="hidden sm:flex"
                  >
                    Select All
                  </Button>
                )}
                {onClearSelection && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClearSelection}
                  >
                    Cancel
                  </Button>
                )}
              </>
            ) : (
              <>
                {memoriesCount !== undefined && memoriesCount > 0 && setIsSelectionMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectionMode(true)}
                    className="hidden sm:flex"
                  >
                    Select
                  </Button>
                )}
                {onCreateMemory && (
                  <Button size="sm" onClick={onCreateMemory}>
                    <PlusIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Memory</span>
                  </Button>
                )}
              </>
            )}
          </div>
        )}
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
          handleModeChange={() => {}}
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