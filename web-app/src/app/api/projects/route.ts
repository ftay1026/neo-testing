// src/app/api/projects/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return new Response('Error fetching projects', { status: 500 });
    }

    return Response.json(projects || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { name, description, is_default } = await request.json();

    if (!name?.trim()) {
      return new Response('Project name is required', { status: 400 });
    }

    // If setting as default, unset other default projects
    if (is_default) {
      await supabase
        .from('projects')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return new Response('Error creating project', { status: 500 });
    }

    return Response.json(newProject);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { projectIds } = await request.json();

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return new Response('Project IDs are required', { status: 400 });
    }

    // Check if any of the projects to delete are default projects
    const { data: defaultProjects, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .in('id', projectIds);

    if (checkError) {
      console.error('Error checking default projects:', checkError);
      return new Response('Error checking projects', { status: 500 });
    }

    if (defaultProjects && defaultProjects.length > 0) {
      return new Response('Cannot delete default project', { status: 400 });
    }

    // Delete projects (chats, documents will be cascade deleted due to foreign key constraints)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', user.id)
      .in('id', projectIds);

    if (error) {
      console.error('Error deleting projects:', error);
      return new Response('Error deleting projects', { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}