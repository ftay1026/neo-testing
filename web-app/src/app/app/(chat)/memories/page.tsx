// src/app/app/(chat)/memories/page.tsx
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";
import { MemoriesClient } from "@/components/memories-client";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getUserMemories } from "@/utils/supabase/queries";

export default async function MemoriesPage() {
  const supabase: SupabaseClient<Database> = await createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch initial memories data server-side for better performance and SEO
  const initialMemories = await getUserMemories(supabase);

  return (
    <MemoriesClient 
      initialMemories={initialMemories.map(memory => ({
        ...memory,
        category: memory.category || '',
      }))}
      user={user} 
    />
  );
}