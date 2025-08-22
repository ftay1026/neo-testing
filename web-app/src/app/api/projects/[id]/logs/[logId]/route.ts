// /app/api/projects/[id]/logs/[logId]/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { id: projectId, logId } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const logIdNumber = parseInt(logId);
    if (isNaN(logIdNumber)) {
      return new Response('Invalid log ID', { status: 400 });
    }

    // Delete the log (verify ownership through RLS)
    const { error } = await supabase
      .from('interaction_logs')
      .delete()
      .eq('id', logIdNumber)
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting interaction log:', error);
      return new Response('Error deleting log', { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}