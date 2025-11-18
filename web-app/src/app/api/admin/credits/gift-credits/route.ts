import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import { createAdminClient } from "@/utils/supabase/admin";
import { getUser } from "@/utils/supabase/queries";
import { createClient } from "@/utils/supabase/server";

interface AddCreditsBody {
    customer_id: string;
    amount: number;
    description: string;
}

export async function POST(request: Request) {
    try {
        const supabase: SupabaseClient<Database> = await createClient();
        const user = await getUser(supabase);

        // Admin check
        if (user?.email !== process.env.ADMIN_EMAILS || user == null) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body: AddCreditsBody = await request.json();

        if (!body.customer_id || !body.amount || !body.description) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const admin: SupabaseClient<Database> = await createAdminClient();

        const { error } = await admin.rpc("add_credits", {
            p_customer_id: body.customer_id,
            p_amount: body.amount,
            p_description: body.description,
        });

        if (error) {
            console.error("Error adding credits:", error);
            return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error in POST /api/admin/credits/add:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
