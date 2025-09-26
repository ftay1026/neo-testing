// /app/api/projects/[id]/logs/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { InteractionLog } from '@/types/app.types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response('Project not found', { status: 404 });
    }

    // Get all interaction logs for chats in this project
    const { data: logs, error } = await supabase
      .from('interaction_logs')
      .select(`
        id, 
        title, 
        content, 
        log_period_start, 
        log_period_end, 
        created_at, 
        updated_at,
        chat_id,
        chats!inner(title)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interaction logs:', error);
      return new Response('Error fetching logs', { status: 500 });
    }

    // Transform to include chat title information
    const logsWithChatInfo: InteractionLog[] = logs?.map(log => ({
      id: log.id,
      project_id: projectId,
      title: log.title,
      content: log.content,
      log_period_start: log.log_period_start,
      log_period_end: log.log_period_end,
      created_at: log.created_at,
      updated_at: log.updated_at,
      chat_id: log.chat_id,
      chat_title: log.chats?.title || 'Unknown Chat',
    })) || [];

    return Response.json(logsWithChatInfo);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}