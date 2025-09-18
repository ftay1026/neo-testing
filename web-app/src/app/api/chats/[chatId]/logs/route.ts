// /app/api/chats/[chatId]/logs/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { InteractionLog } from '@/types/app.types';

// Types for the messages query result
interface MessagePart {
  type: string;
  text?: string;
}

interface ChatMessage {
  id: string;
  role: string;
  parts: MessagePart[];
  created_at: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify user owns the chat and get chat details
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, title, project_id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single();

    if (chatError || !chat) {
      return new Response('Chat not found', { status: 404 });
    }

    // Get the last log for this chat to determine the period start
    const { data: lastLog } = await supabase
      .from('interaction_logs')
      .select('log_period_end')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const periodStart = lastLog?.log_period_end || new Date(0).toISOString(); // Start from beginning if no previous log
    const periodEnd = new Date().toISOString();

    // Get messages from this specific chat after the last log
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, parts, created_at')
      .eq('chat_id', chatId)
      .gt('created_at', periodStart)
      .lte('created_at', periodEnd)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new Response('Error fetching messages', { status: 500 });
    }

    // Transform the data to our typed interface
    const messages: ChatMessage[] = (messagesData || []).map(msg => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts as unknown as MessagePart[],
      created_at: msg.created_at,
    }));

      // Get previous logs for this chat to maintain continuity
    const { data: previousLogs } = await supabase
      .from('interaction_logs')
      .select('id, project_id,title, content, created_at, updated_at, log_period_start, log_period_end, chat_id')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true }); // Chronological order

    // Generate log content using AI with previous logs for continuity
    const logContent = await generateChatLogContent(
      messages, 
      chat.title, 
      periodStart, 
      periodEnd, 
      previousLogs,
    );

    // Create the log title with chat context
    const logTitle = `Log - ${chat.title} - at ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

    // Save the log
    const { data: newLog, error: insertError } = await supabase
      .from('interaction_logs')
      .insert({
        project_id: chat.project_id,
        chat_id: chatId,
        user_id: user.id,
        title: logTitle,
        content: logContent,
        log_period_start: periodStart,
        log_period_end: periodEnd,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating log:', insertError);
      return new Response('Error creating log', { status: 500 });
    }

    return Response.json(newLog);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

async function generateChatLogContent(
  messages: ChatMessage[],
  chatTitle: string,
  periodStart: string,
  periodEnd: string,
  previousLogs: InteractionLog[] | null, // Add previous logs parameter
): Promise<string> {
  // Guard clause for empty messages
  if (!messages || messages.length === 0) {
    return generateChatFallbackContent(chatTitle, periodStart, periodEnd);
  }

  // Format previous logs context
  let previousLogsContext = '';
  if (previousLogs && previousLogs.length > 0) {
    previousLogsContext = '\n--- Previous Logs for Context ---\n\n';
    previousLogs.forEach((log, index) => {
      previousLogsContext += `## Previous Log ${index + 1}: ${log.title}\n`;
      previousLogsContext += `*Created: ${new Date(log.created_at).toLocaleDateString()}*\n`;
      previousLogsContext += `*Log Start Period: ${new Date(log.log_period_start).toLocaleDateString()}*\n`;
      previousLogsContext += `*Log End Period: ${new Date(log.log_period_end).toLocaleDateString()}*\n\n`;
      previousLogsContext += `${log.content}\n\n`;
    });
    previousLogsContext += '--- End Previous Logs ---\n\n';
  }

  // Format the current conversation messages
  const conversationText = messages
    .map(msg => {
      const textContent = extractTextFromParts(msg.parts);
      return `${msg.role}: ${textContent}`;
    })
    .join('\n');

  // If no meaningful content was extracted, use fallback
  if (!conversationText.trim()) {
    return generateChatFallbackContent(chatTitle, periodStart, periodEnd);
  }

  // Combine context with priority to recent messages and last log
  const fullContext = `--- Previous logs context ---\n\n${previousLogsContext}--- Current Session Messages (Priority Focus) ---\n\n${conversationText}\n\n--- Current Date Time: ${new Date().toLocaleString()} ---\n\n--- End Current Session ---`;

  const systemPrompt = `Analyze this conversation and create a summary of our conversation with regards to everything we've discussed so far, showing the evolution of how we went from the start of this conversation into the current conclusion. This summary needs to inform ANY new instance of you in the same project about our conversation in a way that gets them to understand me to the level of depth and in the way you do right now. Speak as me, in the first person. Include a timestamp.
\n\n
Additional requirements:  
- Include context from previous logs but emphasize recent developments. 
- Include a timestamp. 
- Use markdown formatting for structure. 
\n\n
The chat is titled "${chatTitle}" and this session covers ${new Date(periodStart).toLocaleDateString()} to ${new Date(periodEnd).toLocaleDateString()}.`;

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      prompt: fullContext,
    });

    return text;
  } catch (error) {
    console.error('Error generating chat log content:', error);
    return generateChatFallbackContent(chatTitle, periodStart, periodEnd);
  }
}

/**
 * Safely extract text content from message parts
 */
function extractTextFromParts(parts: MessagePart[]): string {
  if (!Array.isArray(parts)) {
    console.warn('Invalid parts structure:', parts);
    return '';
  }

  return parts
    .filter((part): part is MessagePart & { text: string } => 
      part && 
      typeof part === 'object' && 
      part.type === 'text' && 
      typeof part.text === 'string'
    )
    .map(part => part.text)
    .join(' ') || 'No text content';
}

/**
 * Generate fallback content when AI generation fails or no messages exist
 */
function generateChatFallbackContent(
  chatTitle: string, 
  periodStart: string, 
  periodEnd: string
): string {
  const startDate = new Date(periodStart).toLocaleDateString();
  const endDate = new Date(periodEnd).toLocaleDateString();
  
  return `# Chat Reflection - ${chatTitle}

*${new Date().toLocaleDateString()}*

I had a conversation in "${chatTitle}" covering some interesting ground. While I don't have specific details to reflect on right now, this chat was part of my ongoing journey with my AI assistant.

## Key Areas
- Continued exploration in this conversation thread
- Building on previous discussions
- Moving forward with new insights

## Next Steps
I plan to engage more deeply in future conversations to capture richer reflections.

*This log was automatically generated. Future logs will contain more detailed insights as conversations develop.*`;
}