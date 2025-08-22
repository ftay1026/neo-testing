import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/queries";
import HeaderAuth from "@/components/header-auth";
import Link from "next/link";
import { Credits } from "@/components/credits";

export default async function CreditsPage() {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <main className="min-h-dvh flex flex-col bg-background">
      <nav className="w-full max-w-7xl mx-auto h-16 flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div className="font-heading font-bold text-2xl sm:text-3xl">
          <Link href="/">NEO</Link>
        </div>
        <HeaderAuth />
      </nav>
        
      <section className="w-full max-w-7xl mx-auto flex-1 flex items-center justify-center py-16 md:py-24 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <Credits />
        </div>
      </section>
    </main>
  );
}