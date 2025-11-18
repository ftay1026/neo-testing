import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getUser } from "@/utils/supabase/queries";

export type CustomerWithCredits = {
  customer_id: string;
  email: string | null;
  user_id: string | null;
  name: string | null;        // display_name returned from function
  is_banned: boolean;
  credits: number | null;
  created_at: string | null;  // timestamptz
};

export async function GET(request: Request) {
  try {
    // 1) Authenticate admin
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user || user.email !== process.env.ADMIN_EMAILS) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse query params
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "20"));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0"));

    // 3) Admin client (bypass RLS)
    const admin: SupabaseClient<Database> = await createAdminClient();

    // 4) Call paginated data function
    const { data: customersData, error: customersError } = await admin.rpc(
      "admin_get_customers",
      {
        search_text: search,
        limit_count: limit,
        offset_count: offset,
      }
    );

    if (customersError) {
      console.error("Error fetching customers via function:", customersError);
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }

    // 5) Call total count function
    const { data: totalCountData, error: countError } = await admin.rpc(
      "admin_get_customers_count",
      {
        search_text: search,
      }
    );

    if (countError) {
      console.error("Error fetching total customers count:", countError);
      return NextResponse.json({ error: "Failed to fetch total count" }, { status: 500 });
    }

    
    // 6) Return response
    return NextResponse.json({
      data: customersData as CustomerWithCredits[],
      total: totalCountData as number,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Error in GET /api/admin/customers:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
