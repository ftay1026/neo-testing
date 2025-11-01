'use client';

import type { Attachment, UIMessage } from 'ai';
import { cn } from '@/lib/utils'
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, StopIcon } from './icons';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { UseChatHelpers } from '@ai-sdk/react';
import { Toggle } from "@/components/ui/toggle"
import { ModeType } from '@/types/app.types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useChatLogs } from '@/hooks/use-chat-logs';
import { NotebookPenIcon, BookCopyIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateUUID } from '@/lib/utils';
import { BrainIcon } from 'lucide-react';
import { useMemoryExtraction } from '@/hooks/use-memory-extraction';
import { useMemories } from '@/hooks/use-memories';
import { MemoryDialog } from '@/components/memory-dialog';
import { ToolCaseIcon } from '@/components/icons';

function PureMultimodalInput({
  chatId,
  input,
  mode,
  handleModeChange,
  setInput,
  status,
  stop,
  messages,
  setMessages,
  handleSubmit,
  className,
  placeholder = "Send a message...", // New prop with default value
  customSubmit, // New prop for custom submit handler
  projectId, // Add projectId prop
  isMemoryChat = false, // NEW: Add this prop with default false


}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  mode: ModeType;
  handleModeChange: (mode: ModeType) => void;
  status: UseChatHelpers['status'];
  stop: () => void;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  placeholder?: string;
  customSubmit?: (e: React.FormEvent) => Promise<void>;
  projectId?: string; // Add projectId prop
  isMemoryChat?: boolean; // NEW: Add to type definition

}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const router = useRouter();

  const [isToolMode, setIsToolMode] = useState(false);

  // Use the enhanced hook
  const {
    checkAndShowLogDialog,
    createLogForChat,
    closeLogDialog,
    isCreatingLog,
    logDialogState
  } = useChatLogs(chatId);

  // Local state for inherit dialog
  const [isInheritingChat, setIsInheritingChat] = useState(false);
  const [showInheritDialog, setShowInheritDialog] = useState(false);

  // Add memory-related state
  const [isMemoryMode, setIsMemoryMode] = useState(isMemoryChat);
  const isMemoryModeRef = useRef(isMemoryChat);
  const [showMemoryDialog, setShowMemoryDialog] = useState(false);
  const [extractedMemory, setExtractedMemory] = useState<{
    title: string;
    content: string;
    category: string;
  } | null>(null);

  const { extractMemoryFromMessage, isExtracting } = useMemoryExtraction();
  const { createMemory } = useMemories();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  // Keep memory mode ref in sync with state
  useEffect(() => {
    isMemoryModeRef.current = isMemoryMode;
  }, [isMemoryMode]);

  // Keep isMemoryMode in sync with isMemoryChat prop
  useEffect(() => {
    if (isMemoryChat) {
      setIsMemoryMode(true);
      isMemoryModeRef.current = true;
    }
  }, [isMemoryChat]);
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '120px'; // Increased from 98px
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  // Handle log button click - use the enhanced hook function
  const handleCreateLogClick = () => {
    checkAndShowLogDialog(messages);
  };

  // Handle log confirmation
  const handleConfirmCreateLog = async () => {
    await createLogForChat();
    // Dialog is closed automatically by the hook
  };

  const handleInheritChatClick = () => {
    if (messages.length === 0) {
      toast.error('No conversation to inherit');
      return;
    }
    setShowInheritDialog(true);
  };

  const handleConfirmInheritChat = async () => {
    setShowInheritDialog(false);
    setIsInheritingChat(true);
    try {
      // Create new chat with inherit flag
      const newChatId = generateUUID();
      const continueMessage = "Continue our previous conversation";

      // Store the continue message in localStorage (same as ProjectChat)
      localStorage.setItem(`initial-message-${newChatId}`, continueMessage);
      localStorage.setItem(`initial-mode-${newChatId}`, mode);

      // Navigate to inherit flag and parent chat id in URL params
      const params = new URLSearchParams({
        parentChatId: chatId, // Parent chat to inherit from
        inherit: 'true', // Flag to trigger server-side summary generation
        hasInitialMessage: 'true', // New approach
      });

      if (projectId) {
        params.append('projectId', projectId);
      }

      router.push(`/app/chat/${newChatId}?${params.toString()}`);
    } catch (error) {
      toast.error('Failed to create inherited chat');
    } finally {
      setIsInheritingChat(false);
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Handle memory extraction if in memory mode
    if (isMemoryModeRef.current && input.trim()) {
      try {
        const extracted = await extractMemoryFromMessage(input);

        if (extracted?.shouldRemember) {
          setExtractedMemory({
            title: extracted.title || 'Untitled Memory',
            content: extracted.content || input,
            category: extracted.category || 'personal_info'
          });
          setShowMemoryDialog(true);
          if (!isMemoryChat)
            setIsMemoryMode(false); // Reset memory mode
        } else {
          toast.info(extracted?.message || 'No memorable information found in this message');
          if (!isMemoryChat)
            setIsMemoryMode(false); // Reset memory mode
        }
      } catch (error) {
        console.error('Memory extraction error:', error);
        if (!isMemoryChat)
          setIsMemoryMode(false); // Reset memory mode on error
      }
    }

    // Use custom submit handler if provided
    if (customSubmit) {
      customSubmit(e || new Event('submit') as any);
      setLocalStorageInput('');
      resetHeight();
      return;
    }

    //window.history.replaceState({}, '', `/app/chat/${chatId}`);

    handleSubmit(undefined);

    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    handleSubmit,
    setLocalStorageInput,
    width,
    chatId,
    customSubmit,
    isMemoryMode,
    input,
    extractMemoryFromMessage,
  ]);

  // Handle memory save
  const handleSaveMemory = async (memoryData: any) => {
    try {
      await createMemory(memoryData);
      setExtractedMemory(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Generate dialog content based on analysis
  const getLogDialogContent = () => {
    const analysis = logDialogState.analysis;
    if (!analysis) return null;

    if (!analysis.hasNewMessages && analysis.lastLogDate) {
      return (
        <>
          ⚠️ No new messages have been added since your last log was created{' '}
          {analysis.lastLogDate.toLocaleDateString()}. Creating another log will
          capture the same conversation content.
        </>
      );
    }

    if (!analysis.recommendCreate && analysis.hasNewMessages) {
      return (
        <>
          You have {analysis.messageCount} new message{analysis.messageCount !== 1 ? 's' : ''}
          since your last log, but they might not contain substantial content for a meaningful reflection.
          Would you still like to create a log?
        </>
      );
    }

    return (
      <>
        This will create a reflection log of your conversation. The AI will analyze{' '}
        {analysis.messageCount > 0 && `${analysis.messageCount} new message${analysis.messageCount !== 1 ? 's' : ''}`} and
        generate insights about your discussion, breakthroughs, and key learnings.
        {analysis.lastLogDate && (
          <><br /><br />New messages since last log: {analysis.messageCount}</>
        )}
      </>
    );
  };

  return (
    <>
      {!isMemoryChat ? (
        // Regular Chat Input
        <div className="relative w-full flex flex-col gap-4">
          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder={placeholder}
            value={input}
            onChange={handleInput}
            className={cn(
              'min-h-[120px] max-h-[calc(75dvh)] resize-none rounded-2xl !text-base pb-16 pr-14 pl-4 pt-4 dark:border-zinc-700',
              className,
            )}
            rows={3}
            autoFocus
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (status !== 'ready') {
                  toast.error('Please wait for the model to finish its response!');
                } else {
                  submitForm();
                }
              }
            }}
          />

          <div className="absolute bottom-3 w-full">
            <div className="flex flex-row gap-2 items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <ModeButton
                  mode={mode}
                  handleModeChange={handleModeChange}
                />
                <ToolCaseButton
                  isToolMode={isToolMode}
                  onToggleToolMode={() => setIsToolMode(!isToolMode)}
                />
                <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${isToolMode
                  ? 'max-w-xs opacity-100 transform translate-x-0'
                  : 'max-w-0 opacity-0 transform -translate-x-4'
                  }`}>
                  <LogButton
                    onCreateLog={handleCreateLogClick}
                    isCreating={isCreatingLog}
                  />
                  <InheritChatButton
                    onInheritChat={handleInheritChatClick}
                    isInheriting={isInheritingChat}
                    hasMessages={messages.length > 0}
                  />
                  <MemoryButton
                    isMemoryMode={isMemoryMode}
                    onToggleMemoryMode={() => {
                      if (!isMemoryChat) {
                        setIsMemoryMode(!isMemoryMode);
                      }
                    }}
                    isExtracting={isExtracting}
                  />
                </div>
              </div>

              <div className="w-fit">
                {status === 'submitted' ? (
                  <StopButton stop={stop} setMessages={setMessages} />
                ) : (
                  <SendButton
                    input={input}
                    submitForm={submitForm}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Memory Chat Input - Simplified
        <div className="relative w-full flex flex-col">
          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder={placeholder}
            value={input}
            onChange={handleInput}
            className={cn(
              'min-h-[60px] max-h-[200px] resize-none rounded-2xl !text-base py-3 pr-12 pl-4 dark:border-zinc-700',
              className,
            )}
            rows={2}
            autoFocus
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (status !== 'ready') {
                  toast.error('Please wait for the model to finish its response!');
                } else {
                  submitForm();
                }
              }
            }}
          />

          {/* Button inside textarea - positioned absolutely */}
          <div className="absolute right-2 bottom-2">
            {status === 'submitted' ? (
              <StopButton stop={stop} setMessages={setMessages} />
            ) : (
              <SendButton
                input={input}
                submitForm={submitForm}
              />
            )}
          </div>
        </div>
      )}



      {/* Log Creation Confirmation Dialog */}
      <AlertDialog open={logDialogState.show} onOpenChange={closeLogDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Interaction Log</AlertDialogTitle>
            <AlertDialogDescription>
              {getLogDialogContent()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateLog}>
              Create Log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inherit Chat Confirmation Dialog */}
      <AlertDialog open={showInheritDialog} onOpenChange={setShowInheritDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Continue Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new chat that continues this conversation. The AI will
              receive a summary of your current discussion to maintain context, allowing
              you to seamlessly continue where you left off.
              <br /><br />
              You'll be taken to a new chat page with the conversation context preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInheritChat}>
              Continue in New Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Memory Dialog */}
      <MemoryDialog
        isOpen={showMemoryDialog}
        onOpenChange={setShowMemoryDialog}
        onSave={handleSaveMemory}
        chatId={chatId}
        initialTitle={extractedMemory?.title}
        initialContent={extractedMemory?.content}
        initialCategory={extractedMemory?.category}
      />
    </>
  );
}

export const ChatInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.mode !== nextProps.mode) return false;
    if (prevProps.projectId !== nextProps.projectId) return false;
    if (prevProps.chatId !== nextProps.chatId) return false;

    return true;
  },
);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

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
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 bg-secondary text-secondary-foreground hover:bg-secondary/90"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
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

// Mode button to switch between coach, and assistant modes in system prompt
const PureModeButton = ({ mode, handleModeChange }: { mode: ModeType; handleModeChange: (mode: ModeType) => void }) => {
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
                {mode === 'coach' ? 'C' : 'C'}
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

const PureLogButton = ({
  onCreateLog,
  isCreating
}: {
  onCreateLog: () => void;
  isCreating: boolean;
}) => {
  return (
    <div className='flex items-center gap-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Toggle
              className='h-8 w-fit cursor-pointer px-2'
              aria-label='Create Interaction Log'
              pressed={false} // Not a toggle, just a button action
              onClick={onCreateLog}
              disabled={isCreating}
            >
              <NotebookPenIcon className="w-3 h-3" />
            </Toggle>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Log</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

const LogButton = memo(PureLogButton, (prevProps, nextProps) => {
  if (prevProps.isCreating !== nextProps.isCreating) return false;
  return true;
});

const PureInheritChatButton = ({
  onInheritChat,
  isInheriting,
  hasMessages
}: {
  onInheritChat: () => void;
  isInheriting: boolean;
  hasMessages: boolean;
}) => {
  return (
    <div className='flex items-center gap-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Toggle
              className='h-8 w-fit cursor-pointer px-2'
              aria-label='Inherit Chat'
              pressed={false} // Not a toggle, just a button action
              onClick={onInheritChat}
              disabled={isInheriting || !hasMessages}
            >
              <BookCopyIcon className="w-3 h-3" />
            </Toggle>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Inherit</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

const InheritChatButton = memo(PureInheritChatButton, (prevProps, nextProps) => {
  if (prevProps.isInheriting !== nextProps.isInheriting) return false;
  if (prevProps.hasMessages !== nextProps.hasMessages) return false;
  return true;
});

const PureMemoryButton = ({
  isMemoryMode,
  onToggleMemoryMode,
  isExtracting
}: {
  isMemoryMode: boolean;
  onToggleMemoryMode: () => void;
  isExtracting: boolean;
}) => {
  return (
    <div className='flex items-center gap-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Toggle
              className={`h-8 w-fit cursor-pointer px-2 transition-all duration-200 ${isMemoryMode ? 'memory-button-active' : ''}`}
              aria-label='Memory Mode'
              pressed={isMemoryMode}
              onPressedChange={onToggleMemoryMode}
              disabled={isExtracting}
              data-memory-button-active={isMemoryMode}
            >
              <BrainIcon className="w-3 h-3" />
            </Toggle>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMemoryMode ? 'Remember' : 'Remember'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

const MemoryButton = memo(PureMemoryButton, (prevProps, nextProps) => {
  if (prevProps.isMemoryMode !== nextProps.isMemoryMode) return false;
  if (prevProps.isExtracting !== nextProps.isExtracting) return false;
  return true;
});

const PureToolCaseButton = ({
  isToolMode,
  onToggleToolMode,
}: {
  isToolMode: boolean;
  onToggleToolMode: () => void;
}) => {
  return (
    <div className='flex items-center gap-2'>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Toggle
              className={`h-8 w-fit cursor-pointer px-2 transition-all duration-200 ${isToolMode
                ? 'tool-active'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              aria-label='Toggle Tools'
              pressed={isToolMode}
              onPressedChange={onToggleToolMode}
              data-tool-active={isToolMode}
            >
              <ToolCaseIcon className={`transition-transform duration-200 ${isToolMode ? 'rotate-12' : ''}`} />
            </Toggle>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isToolMode ? 'Hide tools' : 'Show tools'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

const ToolCaseButton = memo(PureToolCaseButton, (prevProps, nextProps) => {
  if (prevProps.isToolMode !== nextProps.isToolMode) return false;
  return true;
});
