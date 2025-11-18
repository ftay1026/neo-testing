// /app/api/admin/update-billing/route.ts
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getUser } from '@/utils/supabase/queries';

export async function PATCH(request: Request) {
  try {
    // 1) Authenticate user
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user || user.email !== process.env.ADMIN_EMAILS) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Get request body
    const body = await request.json();
    const {
      credit_value,
      input_rate,
      output_rate,
      margin_multiplier,
    } = body;

    if (
      credit_value === undefined ||
      input_rate === undefined ||
      output_rate === undefined ||
      margin_multiplier === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing billing setting fields' },
        { status: 400 }
      );
    }

    // 3) Admin client (bypasses RLS)
    const adminClient: SupabaseClient<Database> = await createAdminClient();

    // 4) Call RPC function
    const { data, error } = await adminClient.rpc(
      'admin_update_billing_settings',
      {
        p_credit_value: credit_value,
        p_input_rate: input_rate,
        p_output_rate: output_rate,
        p_margin_multiplier: margin_multiplier,
      }
    );

    if (error) {
      console.error('RPC Error:', error);
      return NextResponse.json(
        { error: 'Failed to update billing settings' },
        { status: 500 }
      );
    }

    // 5) Success response
    return NextResponse.json({
      message: 'Billing settings updated successfully',
      updated: data,
    });
  } catch (err) {
    console.error('Error in update billing route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
