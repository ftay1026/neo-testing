// src/app/app/(chat)/chat/[id]/page.tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId, getUser } from '@/utils/supabase/queries';
import { notFound } from 'next/navigation';
import { Attachment, UIMessage } from 'ai';
import { Database } from '@/types/database.types';
import { ModeType } from '@/types/app.types';
import { getProjectById } from '@/utils/supabase/queries';
import { generateUUID } from '@/lib/utils';
import { generateChatSummary } from '@/app/actions';

type DBMessage = Database['public']['Tables']['messages']['Row'];

export default async function Page(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect("/sign-in");
  }
  
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;

  // Check if this is a new chat from project page or inherit chat
  const initialMessage = searchParams.initialMessage;
  let parentChatId: string | null = typeof searchParams.parentChatId === 'string' ? searchParams.parentChatId : null; // Extract parentChatId from URL
  const isInheritChat = searchParams.inherit === 'true'; // Check inherit flag
  let projectId = typeof searchParams.projectId === 'string' ? searchParams.projectId : undefined;
  const mode = typeof searchParams.mode === 'string' ? searchParams.mode as ModeType : 'coach';

  let initialMessages: Array<UIMessage> = [];
  let chatData = null;
  let newMessage: UIMessage | null = null;
  let chatSummary: string | null = null;
  let parentChatTitle: string | null = null;

  if (initialMessage && typeof initialMessage === 'string') {
    // NEW CHAT: Create the user message

    const decodedInitialMessage = decodeURIComponent(initialMessage);
    let content = decodedInitialMessage;
    const messageId = generateUUID();
    let newChatTitle = 'Untitled';

    // Generate summary if this is an inherit chat
    if (isInheritChat && parentChatId) {
      const parentChat = await getChatById(supabase, parentChatId);
      if (!parentChat) {
        notFound();
      }

      // If the parent chat is private and not owned by the user, return not found
      if (parentChat.visibility === 'private' && user.id !== parentChat.user_id) {
        return notFound();
      }

      chatSummary = await generateChatSummary(parentChatId);

      newChatTitle = `${parentChat.title} continued on ${new Date().toLocaleDateString()}`;
      parentChatTitle = parentChat.title;
      content = `continue our previous conversation ${parentChat.title}`;
    }

    // Get project info for header
    if (projectId) {
      const project = await getProjectById(supabase, projectId);
      chatData = {
        id,
        title: newChatTitle,
        project_id: projectId,
        projects: project,
        parent_chat_id: parentChatId,
      };
    }

    const userMessage: UIMessage = {
      id: messageId,
      role: 'user',
      content: content,
      parts: [{ type: 'text', text: content }],
      createdAt: new Date(),
      experimental_attachments: [],
    };

    newMessage = userMessage;
  } else {
    // EXISTING CHAT: Load from database
    const chat = await getChatById(supabase, id);
    if (!chat) {
      notFound();
    }

    if (chat.visibility === 'private' && user.id !== chat.user_id) {
      return notFound();
    }

    const messagesFromDb = await getMessagesByChatId(supabase, id);
    initialMessages = convertToUIMessages(messagesFromDb);
    chatData = chat;

    if (chat.parent_chat_id) {
      const parentChat = await getChatById(supabase, chat.parent_chat_id);
      if (parentChat) {
        parentChatTitle = parentChat.title;
      }
    }
  }

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      content: (message.parts as UIMessage['parts'])?.filter(part => part.type === 'text').map(part => (part as { text: string, type: 'text' }).text).join('') || '',
      createdAt: new Date(message.created_at),
      experimental_attachments: [],
    }));
  }

  // Extract project information from the chat
  const projectName = chatData?.projects?.name;
  projectId = chatData?.project_id
  parentChatId = chatData?.parent_chat_id || null;
  const chatTitle = chatData?.title || 'Untitled';

  // Check if we need to resume streaming
  // const resumeStream = searchParams.resumeStream === 'true';
  // const messageId = typeof searchParams.messageId === 'string' ? searchParams.messageId : undefined;

  return (
    <>
      <Chat
        id={id}
        initialMessages={initialMessages}
        selectedVisibilityType="private"
        isReadonly={false}
        projectId={projectId}
        projectName={projectName}
        chatTitle={chatTitle}
        // resumeStream={resumeStream}
        // streamingMessageId={messageId}
        initialMode={mode}
        isNewChat={!!initialMessage} // Indicate if this is a new chat
        newMessage={newMessage}
        parentChatId={parentChatId}
        chatSummary={chatSummary}
        parentChatTitle={parentChatTitle}
      />
    </>
  );
}