import { createClient } from '@/utils/supabase/server';
import { updatePrompt, deletePrompt, setPromptAsUsed } from '@/utils/supabase/queries-lab';
import { getUser } from '@/utils/supabase/queries';
import { isAdminUser } from '@/lib/utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id || !isAdminUser(user.email)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { name, prompt, used, type } = await request.json();

    // If setting as used, use special function
    if (used !== undefined && used === true && type) {
      const updatedPrompt = await setPromptAsUsed(supabase, id, type);
      return Response.json(updatedPrompt);
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (prompt !== undefined) updates.prompt = prompt.trim();

    const updatedPrompt = await updatePrompt(supabase, id, updates);
    return Response.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    return new Response('Error updating prompt', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id || !isAdminUser(user.email)) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deletePrompt(supabase, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return new Response('Error deleting prompt', { status: 500 });
  }
}