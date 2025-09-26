// src/app/app/(chat)/projects/page.tsx
import { createClient } from "@/utils/supabase/server";
import { getUser, getUserProjects } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";
import { ProjectsClient } from "@/components/projects-client";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch initial projects data server-side for better performance and SEO
  const initialProjects = await getUserProjects(supabase);

  return (
    <ProjectsClient 
      initialProjects={initialProjects.map(project => ({
        ...project,
        description: project.description || '',}
      ))}
      user={user} 
    />
  );
}