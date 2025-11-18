// /app/api/admin/financial-analytics/route.ts

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getUser } from '@/utils/supabase/queries';

export async function GET(request: Request) {
  try {
    // -----------------------------------------
    // 1. Authenticate user
    // -----------------------------------------
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    console.log("Admin user:", user?.email);
    console.log("Allowed admin:", process.env.ADMIN_EMAILS);

    if (!user || user.email !== process.env.ADMIN_EMAILS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------------------
    // 2. Create admin client (service role)
    // -----------------------------------------
    const supabaseAdmin: SupabaseClient<Database> = await createAdminClient();

    // -----------------------------------------
    // 3. Execute RPC function
    // -----------------------------------------
    const { data, error } = await supabaseAdmin.rpc("admin_financial_analytics");

    if (error) {
      console.error("RPC error: admin_financial_analytics", error);
      return NextResponse.json(
        { error: "Failed to load financial analytics" },
        { status: 500 }
      );
    }

    console.log("Financial RPC:", data);

    // -----------------------------------------
    // 4. Success
    // -----------------------------------------
    return NextResponse.json({ analytics: data });

  } catch (err) {
    console.error("Server error in GET /admin/financial-analytics:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
