import { UIMessage } from 'ai';
import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { UseChatHelpers } from '@ai-sdk/react';
import { ProjectInteractionLogsSection } from './project-interaction-logs-section';
import { ProjectFilesSection } from './project-files-section';
import { useSidebar } from './ui/sidebar';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isLogOpen: boolean;
  isProjectKnowledgeOpen: boolean;
  projectId?: string
  closeSideBar: () => void;
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
  projectId,
  closeSideBar
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const { open } = useSidebar();


  const handleSideBarCloser = () => {
    closeSideBar();
  }

  return (
    <div className="flex w-full p-6 overflow-hidden xl:overflow-y-scroll">
      {/* Left Section (Desktop only) */}
      {!open && (
        <div
          className={`hidden xl:block max-w-sm w-[15%] min-w-3xs ${isLogOpen ? "xl:visible" : "xl:invisible"
            }`}
        >
          <div className="bg-background/50 rounded-lg">
            <ProjectInteractionLogsSection projectId={projectId!} />
          </div>
        </div>
      )}

      {/* Middle Section - full width <1200px */}
      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 pt-4 w-full overflow-y-auto xl:overflow-hidden"
      >
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

      {/* Right Section (Desktop only) */}
      {!open && (
        <div
          className={`hidden xl:block max-w-sm w-[15%] min-w-3xs ${isProjectKnowledgeOpen ? "xl:visible" : "xl:invisible"
            }`}
        >
          <div className="rounded-lg">
            <ProjectFilesSection projectId={projectId!} />
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