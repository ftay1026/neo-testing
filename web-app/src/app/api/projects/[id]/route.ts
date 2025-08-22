// src/app/api/projects/[id]/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { name, description, is_default } = await request.json();

    if (!name?.trim()) {
      return new Response('Project name is required', { status: 400 });
    }

    // Verify user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingProject) {
      return new Response('Project not found', { status: 404 });
    }

    // If setting as default, unset other default projects
    if (is_default && !existingProject.is_default) {
      await supabase
        .from('projects')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    // Don't allow unsetting default if this is the only project
    if (existingProject.is_default && !is_default) {
      const { data: projectCount } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id);

      if (projectCount && projectCount.length === 1) {
        return new Response('Cannot unset default on the only project', { status: 400 });
      }
    }

    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        is_default: is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return new Response('Error updating project', { status: 500 });
    }

    return Response.json(updatedProject);
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}