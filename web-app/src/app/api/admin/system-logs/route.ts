import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getUser } from "@/utils/supabase/queries";

export type SystemLog = {
  id: string;
  event_type: string;
  category: string;
  message: string;
  metadata: any;
  user_id: string | null;
  customer_id: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    // 1) Authenticate admin
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    // if (!user || user.email !== process.env.ADMIN_EMAILS) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // 2) Parse query params
    const url = new URL(request.url);
    const eventType = url.searchParams.get("event_type")?.trim() || "";
    const category = url.searchParams.get("category")?.trim() || "";
    const customerId = url.searchParams.get("customer_id")?.trim() || "";
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "50"));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0"));

    // 3) Admin client (bypass RLS)
    const admin: SupabaseClient<Database> = await createAdminClient();

    // 4) Build query
    let query = admin
      .from("system_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (eventType) {
      query = query.eq("event_type", eventType);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data: logsData, error: logsError, count } = await query;

    if (logsError) {
      console.error("Error fetching system logs:", logsError);
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }

    // 5) Return response
    return NextResponse.json({
      data: logsData as SystemLog[],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Error in GET /api/admin/system-logs:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}