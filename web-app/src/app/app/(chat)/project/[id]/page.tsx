// src/app/app/(chat)/project/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { 
  getUser, 
  getProjectById, 
  getChatsByProjectId, 
  getDocumentsByProjectId 
} from "@/utils/supabase/queries";
import { redirect, notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/project-detail-client";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect("/sign-in");
  }

  try {
    // Fetch initial data server-side for better performance and SEO
    const [project, chats, documents] = await Promise.all([
      getProjectById(supabase, projectId),
      getChatsByProjectId(supabase, projectId),
      getDocumentsByProjectId(supabase, projectId)
    ]);

    if (!project) {
      return notFound();
    }

    return (
      <ProjectDetailClient 
        initialProject={
          { 
            ...project, 
            description: project.description || '' 
          }
        }
        initialChats={chats}
        initialDocuments={
          documents.map(doc => ({
            ...doc,
            content: doc.content || ''
          }))
        }
        user={user}
      />
    );
  } catch (error) {
    console.error('Error loading project:', error);
    return notFound();
  }
}