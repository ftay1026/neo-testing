// src/app/app/(chat)/memories/page.tsx
import { createClient } from "@/utils/supabase/server";
import { getChatById, getChatsByProjectId, getMemoryChats, getMessagesByChatId, getProjectById, getUser, getUserDefaultProject, saveChat } from "@/utils/supabase/queries";
import { notFound, redirect } from "next/navigation";
import { MemoriesClient } from "@/components/memories-client";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { getUserMemories } from "@/utils/supabase/queries";
import { generateUUID } from '@/lib/utils';
import { UIMessage } from "ai";

type DBMessage = Database['public']['Tables']['messages']['Row'];

export default async function MemoriesPage() {
  const supabase: SupabaseClient<Database> = await createClient();
  const user = await getUser(supabase);

  let chatDetails = {
    MemoryChatId: "",
    projectId: "",
    projectName: "",
    chatTitle: "",
    initialMessages: [] as UIMessage[]
  };

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch initial memories data server-side for better performance and SEO
  const initialMemories = await getUserMemories(supabase);
  try {
    const project = await getUserDefaultProject(supabase);
    let chat = await getMemoryChats(supabase, project.id);
    if (!chat) {
      // Create "Memories" chat if it doesn't exist
      const chat_id = await saveChat(supabase, generateUUID(), "Memories", project.id, null, null, "private");
      chat = await getChatById(supabase, chat_id);
    }

    // Added null check for safety
    if (!chat) {
      throw new Error('Failed to create or retrieve memory chat');
    }

    const messagesFromDb = await getMessagesByChatId(supabase, chat.id);
    const initialMessages = convertToUIMessages(messagesFromDb);
    chatDetails = {
      MemoryChatId: chat.id,
      projectId: project.id,
      projectName: chat?.projects.name || 'Default Project',
      chatTitle: chat?.title || 'Memories',
      initialMessages: initialMessages
    }
    console.log("project", project);
    console.log("Memory chat is already exist", chat);
  } catch (error) {
    console.error('Error loading project:', error);
    return notFound();
  }



  return (
    <MemoriesClient
      initialMemories={initialMemories.map(memory => ({
        ...memory,
        category: memory.category || '',
      }))}
      user={user}
      MemoryChatId={chatDetails.MemoryChatId}
      projectId={chatDetails.projectId}
      projectName={chatDetails.projectName}
      chatTitle={chatDetails.chatTitle}
      initialMessages={chatDetails.initialMessages}

    />
  );
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