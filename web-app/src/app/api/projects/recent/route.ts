// src/app/api/projects/recent/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return Response.json('Unauthorized', { status: 401 });
    }

    // Get projects with their latest activity (last chat creation or update)
    // and chat count, ordered by most recent activity
    const { data: recentProjects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        is_default,
        created_at,
        updated_at,
        chats!inner(created_at)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(8); // Limit to 8 most recent projects

    if (error) {
      console.error('Error fetching recent projects:', error);
      return Response.json('Error fetching recent projects', { status: 500 });
    }

    // Process the data to get the last activity and chat count for each project
    const processedProjects = recentProjects.map(project => {
      const chats = project.chats || [];
      const chatCount = chats.length;
      
      // Find the most recent chat creation date as last activity
      const lastActivity = chats.length > 0 
        ? chats.reduce((latest, chat) => {
            const chatDate = new Date(chat.created_at);
            return chatDate > new Date(latest) ? chat.created_at : latest;
          }, chats[0].created_at)
        : project.updated_at; // Fallback to project updated_at if no chats

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        is_default: project.is_default,
        created_at: project.created_at,
        updated_at: project.updated_at,
        last_activity: lastActivity,
        chat_count: chatCount,
      };
    });

    // Sort by last activity (most recent first)
    processedProjects.sort((a, b) => 
      new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    );

    return Response.json(processedProjects);
  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json('An error occurred', { status: 500 });
  }
}