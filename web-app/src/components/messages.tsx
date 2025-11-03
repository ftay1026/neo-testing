import { UIMessage } from 'ai';
import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { UseChatHelpers } from '@ai-sdk/react';
import { ProjectInteractionLogsSection } from './project-interaction-logs-section';
import { ProjectFilesSection } from './project-files-section';
import { useSidebar } from './ui/sidebar';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MemoryToggleClient } from './memory-toggle';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isLogOpen: boolean;
  isProjectKnowledgeOpen: boolean;
  isMemoriesOpen: boolean;
  projectId?: string
  closeSideBar: () => void;
  hideKnowledgeAndLogs: boolean;

}

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
  isLogOpen,
  isProjectKnowledgeOpen,
  isMemoriesOpen,
  projectId,
  closeSideBar,
  hideKnowledgeAndLogs = false,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const { open } = useSidebar();


  const handleSideBarCloser = () => {
    closeSideBar();
  }

  return (
    <div className="flex w-full h-full px-2    flex-row justify-center items-center ">
      {/* Left Section (Desktop only) - Memories Logs */}
      {!hideKnowledgeAndLogs && <div
        className={`flex-row justify-end h-full items-start w-[25%] max-w-96   flex-shrink-0 pt-14 p-6 pr-0 ${open
          ? "hidden min-[1280px]:hidden min-[1500px]:flex"
          : "hidden min-[1280px]:flex"
          }`}
      >
        <div
          className={`bg-background/50 rounded-lg h-full w-full overflow-y-auto max-w-80 pr-4 flex flex-col justify-start items-baseline scrollbar-custom ${isMemoriesOpen ? "visible" : "invisible"
            }`}
        >
          <MemoryToggleClient />
        </div>
      </div>}


      {/* Middle Section - Messages */}
      <div className="flex  flex-1 flex-col h-full px-4 p-3 min-w-0   max-w-3xl  overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto w-full max-w-3xl  min-w-0 scrollbar-custom py-4"
        >
          <div className={`flex flex-col gap-6 xl:max-w-full  max-w-3xl min-w-0 mx-auto `}>
            {messages.map((message, index) => (
              <PreviewMessage
                key={message.id}
                chatId={chatId}
                message={message}
                isLoading={status === "streaming" && messages.length - 1 === index}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
              />
            ))}
            <div
              ref={messagesEndRef}
              className="shrink-0 min-w-[24px] min-h-[24px]"
            />
          </div>
        </div>
      </div>

      {/* Right Section (Desktop only) -  Interaction Logs & Project Knowledge  */}

      {!hideKnowledgeAndLogs && (
        <div className={`flex flex-col w-[25%] max-w-96 h-full overflow-y-auto scrollbar-custom ${open
          ? "hidden min-[1280px]:hidden min-[1500px]:flex"
          : "hidden min-[1280px]:flex"
          }`}>

          <div
            className={`flex flex-col justify-start items-start flex-shrink-0 pt-10 p-6 pl-1 ${isProjectKnowledgeOpen ? "block" : "hidden"
              }`}
          >
            <div className="rounded-lg flex flex-col w-full">
              <ProjectFilesSection projectId={projectId!} />
            </div>
          </div>

          <div
            className={`flex flex-col justify-start items-start flex-shrink-0 pt-6 p-6 pr-0 ${isLogOpen ? "block" : "hidden"
              }`}
          >
            <div className="bg-background/50 rounded-lg max-w-80 pr-4 flex flex-col justify-start items-baseline w-full">
              <ProjectInteractionLogsSection projectId={projectId!} />
            </div>
          </div>

        </div>
      )}
      {/* Mobile Slider (only visible <1200px) */}
      <div className="xl:hidden">
        {/* Left side slider for interaction logs */}
        {isLogOpen && (
          <div className="fixed left-0 top-0 h-full w-[300px] bg-background/95 backdrop-blur-sm z-50 shadow-lg transform transition-transform duration-300 ease-in-out">
            <div className="p-4 h-full overflow-y-auto">
              <div className="bg-background/50 rounded-lg h-full">
                <ProjectInteractionLogsSection projectId={projectId!} />
              </div>
            </div>
          </div>
        )}

        {/* Right side slider for project knowledge */}
        {isProjectKnowledgeOpen && (
          <div className="fixed right-0 top-0 h-full w-[300px] bg-background/95 backdrop-blur-sm z-50 shadow-lg transform transition-transform duration-300 ease-in-out">
            <div className="p-4 h-full overflow-y-auto">
              <div className="rounded-lg h-full">
                <ProjectFilesSection projectId={projectId!} />
              </div>
            </div>
          </div>
        )}

        {/* Backdrop overlay when either slider is open */}
        {(isLogOpen || isProjectKnowledgeOpen) && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={handleSideBarCloser}
          />
        )}
      </div>
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});