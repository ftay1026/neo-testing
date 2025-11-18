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


    // if (!user || user.email !== process.env.ADMIN_EMAILS) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // 2) Read request payload
    const { customer_id, new_expiry } = await request.json();

    console.log('Extend expiry request:', { customer_id, new_expiry })
    if (!customer_id || !new_expiry) {
      return NextResponse.json(
        { error: 'Missing customer_id or new_expiry' },
        { status: 400 }
      );
    }

    // 3) Create admin client (bypass RLS)
    const adminClient: SupabaseClient<Database> = await createAdminClient();

    // 4) Call RPC
    const { error } = await adminClient.rpc('admin_update_credit_expiry', {
      p_customer_id: customer_id,
      p_new_expiry: new_expiry, // must be ISO string
    });

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { error: 'Failed to update credit expiry' },
        { status: 500 }
      );
    }

    // 5) Success response
    return NextResponse.json({
      message: 'Credit expiry updated successfully',
      customer_id,
      new_expiry,
    });

  } catch (error) {
    console.error('Error in PATCH extend-expiry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
