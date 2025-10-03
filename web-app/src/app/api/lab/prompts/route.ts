import { createClient } from '@/utils/supabase/server';
import { getPromptsByType, createPrompt } from '@/utils/supabase/queries-lab';
import { getUser } from '@/utils/supabase/queries';
import { isAdminUser } from '@/lib/utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export async function GET(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id || !isAdminUser(user.email)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'system';

    const prompts = await getPromptsByType(supabase, type);
    return Response.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return new Response('Error fetching prompts', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id || !isAdminUser(user.email)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { type, name, prompt, used } = await request.json();

    if (!name?.trim() || !prompt?.trim()) {
      return new Response('Name and prompt are required', { status: 400 });
    }

    const newPrompt = await createPrompt(supabase, {
      type: type || 'system',
      name: name.trim(),
      prompt: prompt.trim(),
      used: used || false
    });

    return Response.json(newPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return new Response('Error creating prompt', { status: 500 });
  }
}