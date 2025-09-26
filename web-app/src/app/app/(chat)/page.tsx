import { createClient } from "@/utils/supabase/server";
import { getUser, getUserDefaultProject } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";

import { Chat } from '@/components/chat';

export default async function Page() {
  const supabase = await createClient();
  const [user, defaultProject] = await Promise.all([
    getUser(supabase),
    getUserDefaultProject(supabase)
  ]);

  if (!user) {
    return redirect("/sign-in");
  }

  console.log("Default Project:", defaultProject);

  if (defaultProject?.id) {
    console.log('Redirecting to default project:', defaultProject.id);
    redirect(`/app/project/${defaultProject.id}`); // throws NEXT_REDIRECT
  }

  redirect("/app/projects"); // fallback if no default project
}
