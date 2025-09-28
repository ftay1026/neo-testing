import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import LabPageClient from "./lab-page-client";
import { createClient } from "@/utils/supabase/server";
import { getUser } from "@/utils/supabase/queries";

const REQUIRED_ROLE = "creator";
const REQUIRED_ROLE_NORMALIZED = REQUIRED_ROLE.toLowerCase();

function metadataHasRole(
  metadata: Record<string, unknown> | undefined,
  role: string,
): boolean {
  if (!metadata) return false;

  const normalizedRole = role.toLowerCase();
  const value = metadata.roles ?? metadata.role;

  if (typeof value === "string") {
    return value.toLowerCase() === normalizedRole;
  }

  if (Array.isArray(value)) {
    return value.some(
      (entry) =>
        typeof entry === "string" && entry.toLowerCase() === normalizedRole,
    );
  }

  return false;
}

function userHasRole(user: User | null, role: string): boolean {
  if (!user) return false;

  if (
    metadataHasRole(user.app_metadata as Record<string, unknown> | undefined, role)
  ) {
    return true;
  }

  if (
    metadataHasRole(user.user_metadata as Record<string, unknown> | undefined, role)
  ) {
    return true;
  }

  return false;
}

function mockAccessAllowed() {
  const authenticated =
    process.env.NEXT_PUBLIC_MOCK_AUTHENTICATED?.toLowerCase() !== "false";
  const role = process.env.NEXT_PUBLIC_MOCK_USER_ROLE ?? REQUIRED_ROLE;
  const normalizedRole = role.toLowerCase();

  return authenticated && normalizedRole === REQUIRED_ROLE_NORMALIZED;
}

export default async function LabPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!mockAccessAllowed()) {
      redirect("/");
    }

    return <LabPageClient />;
  }

  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user || !userHasRole(user, REQUIRED_ROLE)) {
    redirect("/");
  }

  return <LabPageClient />;
}
