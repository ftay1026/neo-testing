'use client';
import { useEffect, useState } from "react";

import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getUser, getUserDetails } from "@/utils/supabase/queries";
import { UserAccountNav } from "./user-account-nav";
import { Database } from "@/types/database.types";

export type UserDetails = Database["public"]["Tables"]["profiles"]["Row"];

export default function AuthButtonClient() {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = await createClient();
      const [fetchedUser, fetchedUserDetails] = await Promise.all([
        getUser(supabase),
        getUserDetails(supabase),
      ]);
      setUser(fetchedUser);
      setUserDetails(fetchedUserDetails);
    };

    fetchData();
  }, []);

  return user && userDetails ? (
    <div className="flex items-center gap-4">
      <UserAccountNav user={{ ...userDetails, email: user.email ?? null }} />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}
