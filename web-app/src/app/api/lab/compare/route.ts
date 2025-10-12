import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { isAdminUser } from '@/lib/utils';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

function getModel(modelId: string) {
  if (modelId.startsWith('claude')) {
    return anthropic(modelId);
  }
  return openai(modelId);
}

export async function POST(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id || !isAdminUser(user.email)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const {
      promptA,
      promptB,
      primingPromptA,
      primingPromptB,
      modelA,
      modelB,
      temperature,
      maxTokens,
      userPrompt
    } = await request.json();

    // Generate both responses in parallel
    const [resultA, resultB] = await Promise.all([
      generateText({
        model: getModel(modelA),
        system: promptA,
        prompt: `${primingPromptA}\n\n${userPrompt}`,
        temperature,
        maxTokens
      }),
      generateText({
        model: getModel(modelB),
        system: promptB,
        prompt: `${primingPromptB}\n\n${userPrompt}`,
        temperature,
        maxTokens
      })
    ]);

    return Response.json({
      responseA: resultA.text,
      responseB: resultB.text,
      usageA: resultA.usage,
      usageB: resultB.usage
    });
  } catch (error) {
    console.error('Error running comparison:', error);
    return new Response('Error running comparison', { status: 500 });
  }
}