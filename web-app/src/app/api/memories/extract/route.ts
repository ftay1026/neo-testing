// src/app/api/memories/extract/route.ts
import { generateText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { openai} from '@ai-sdk/openai';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { message, previousMessages } = await request.json();

    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 });
    }

    // Use AI to extract memorable information from the message
    const { text: extractedInfo } = await generateText({
      model: openai('gpt-4o'),
      temperature: 0.3,
      maxTokens: 300,
      system: `You are helping extract memorable personal information that the user would want their AI assistant to remember for future conversations.

Extract and format information that falls into these categories:
- Personal preferences (food, style, communication preferences)
- Values and philosophy 
- Important personal details or context
- Writing style preferences
- Goals and aspirations
- Relationship context
- Work/professional context

Format your response as JSON with:
{
  "title": "Brief descriptive title for this memory",
  "content": "The specific information to remember", 
  "category": "One of: preferences, philosophy, personal_info, writing_style, goals, relationships, professional",
  "shouldRemember": boolean (true if this contains memorable information, false if it's just casual conversation)
}

Only extract information that would be useful for an AI to know about the user in future conversations. If the message doesn't contain memorable information, set shouldRemember to false.`,
      prompt: `Extract memorable information from this user message: "${message}"`,
    });

    try {
      const extracted = JSON.parse(extractedInfo);
      
      // Validate the response
      if (typeof extracted.shouldRemember !== 'boolean') {
        extracted.shouldRemember = false;
      }

      if (!extracted.shouldRemember) {
        return Response.json({ 
          shouldRemember: false, 
          message: "No memorable information detected in this message." 
        });
      }

      return Response.json({
        shouldRemember: true,
        title: extracted.title || 'Untitled Memory',
        content: extracted.content || message,
        category: extracted.category || 'personal_info'
      });

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return Response.json({ 
        shouldRemember: false, 
        message: "Could not extract memorable information from this message." 
      });
    }

  } catch (error) {
    console.error('Error extracting memory:', error);
    return new Response('Error processing message', { status: 500 });
  }
}