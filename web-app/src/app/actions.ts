"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getMessagesByChatId, getUser, getChatById } from '@/utils/supabase/queries';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

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

    // Get previously generated inherited summary if exists
    const parentChat = await getChatById(supabase, parentChatId);
    const previousSummary = parentChat?.inheritance_summary || null;
    
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
      model: openai('gpt-4o'),
      system: `You are an assistant in a chat application that allows users to branch a conversation into a new thread.

Your task now is to produce a self-contained snapshot of the conversation supplied below. This snapshot will be the only context available in the new thread, so include every detail that could influence future answers, while staying concise.

The conversation is between a user and an AI assistant. The user may have shared personal beliefs, preferences, or context that the assistant should remember. The summary should capture these elements to ensure continuity.

The previous summary, if the conversation was already branched, is provided to help you understand the context better. If there is no previous summary, focus solely on the conversation text.

Requirements
1. Structure your output with the following exact section headings (case-sensitive):
   Detailed Summary
   Key Information
   Last 4 Exchanges
2. Detailed Summary  
   • Chronologically explain how the discussion evolved from the first message to the current point.  
   • Focus on decisions, questions, solutions, and reasoning.  
3. Key Information  
   • Bullet-list concrete data shared (names, dates, figures, definitions, URLs, code snippets, etc.).  
   • For each item note who said it (User or assistant) and give a 1-line description of its relevance.  
   • Include all data, personal beliefs, and context that is essential to the topic.
4. Last 4 Exchanges  
   • Provide the last four full message pairs verbatim in chronological order.  
   • Label each message with “User:” or “assistant:”.
5. Do not include any analysis or text outside the three required sections.

The entire prior conversation and its parent summary will be supplied below this prompt; no additional context will follow.`,
      prompt: `previous summary:\n${previousSummary}\n\nconversation text:\n${conversationText}`,
    });

    console.log('Generated chat summary:\n', summary);

    return `Previous conversation context:\n${summary}\n\nThe user wants to continue this conversation. You were the assistant in the previous conversation.`;
    
  } catch (error) {
    console.error('Error generating chat summary:', error);
    return null;
  }
}