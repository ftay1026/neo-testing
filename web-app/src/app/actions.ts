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

    console.log(JSON.stringify(messages, null, 2));

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

    console.log('---------------------------------');
    
    console.log(conversationText);

    // Use AI to generate a concise summary
    const { text: summary } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      temperature: 0.3,
      system: `Analyze this conversation and create a summary of our conversation with regards to everthing we've discussed so far, showing the evolution of how we went from the start of this conversation into the current conclusion.

Keep a list of data shared in the conversation like names, date, etc, with small description and who said to whome for better context.

Keep the last four chat pairs as such for better clarity.

format:
detailed summary:
key identifiable information:
last chat iterations:`,
      prompt: `Please find the conversation:\n\n${conversationText}`,
    });

    return `Previous conversation context:\n${summary}\n\nThe user wants to continue this conversation.`;
    
  } catch (error) {
    console.error('Error generating chat summary:', error);
    return null;
  }
}
