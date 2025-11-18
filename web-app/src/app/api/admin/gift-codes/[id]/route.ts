import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js'
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';

// ===================== PUT =====================
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ Must await params

  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    // if (!user || user.email !== process.env.ADMIN_EMAILS) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { maxUses, expiresAt, notes } = await request.json();
    const supabaseAdminClient = await createAdminClient();

    const { data, error } = await supabaseAdminClient.rpc("edit_gift_code", {
      p_code_id: id,
      p_max_uses: maxUses ?? null,
      p_expires_at: expiresAt ?? null,
      p_notes: notes ?? null
    });

    if (error) {
      console.error("Error editing gift code:", error);
      return NextResponse.json({ error: "Failed to edit gift code" }, { status: 500 });
    }

    const result = data?.[0];

    if (!result?.success) {
      return NextResponse.json({ error: result?.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (error) {
    console.error("Error in PUT gift code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============ DELETE ============
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ Must await params

  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user || user.email !== process.env.ADMIN_EMAILS) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdminClient = await createAdminClient();

    const { data, error } = await supabaseAdminClient.rpc("deactivate_gift_code", {
      p_code_id: id
    });

    if (error) {
      console.error("Error deactivating gift code:", error);
      return NextResponse.json({ error: "Failed to deactivate gift code" }, { status: 500 });
    }

    const result = data?.[0];

    if (!result?.success) {
      return NextResponse.json({ error: result?.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (error) {
    console.error("Error in DELETE gift code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
