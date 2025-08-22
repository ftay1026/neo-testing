"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getMessagesByChatId, getUser } from '@/utils/supabase/queries';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// generate chat summary for inheritted chat page
export async function generateChatSummary(parentChatId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);
    
    if (!user?.id) {
      throw new Error('Unauthorized');
    }

    // Get messages from parent chat
    const messages = await getMessagesByChatId(supabase, parentChatId);
    
    if (messages.length === 0) {
      return null;
    }

    // Convert messages to text format
    const conversationText = messages
      .map(msg => {
        const textContent = (msg.parts as any)
          ?.filter((part: any) => part.type === 'text')
          ?.map((part: any) => part.text)
          ?.join(' ') || '';
        return `${msg.role}: ${textContent}`;
      })
      .join('\n');

    // Use AI to generate a concise summary
    const { text: summary } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      temperature: 0.3,
      maxTokens: 500,
      system: `You are tasked with creating a concise summary of a conversation that will be used to provide context for continuing the conversation in a new chat session.

Requirements:
- Summarize the key topics, decisions, and insights discussed
- Maintain the conversational context and any important details
- Keep it concise but comprehensive enough for seamless continuation
- Focus on what's most relevant for continuing the conversation
- Maximum 500 tokens`,
      prompt: `Please summarize this conversation:\n\n${conversationText}`,
    });

    return `Previous conversation context:\n${summary}\n\nThe user wants to continue this conversation.`;
    
  } catch (error) {
    console.error('Error generating chat summary:', error);
    return null;
  }
}