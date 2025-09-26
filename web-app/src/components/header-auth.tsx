import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { getUser, getUserDetails } from "@/utils/supabase/queries";
import { UserAccountNav } from "./user-account-nav";

export default async function AuthButton() {
  const supabase = await createClient();

  const [user, userDetails] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase),
  ]);

  return user && userDetails ? (
    <div className="flex items-center gap-4">
      <UserAccountNav user={{ ...userDetails, email: user.email ?? null }} />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="lg" variant="default">
        <Link href="/sign-in">Get Started</Link>
      </Button>
    </div>
  );
}