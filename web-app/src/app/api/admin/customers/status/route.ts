// /app/api/admin/customer-status/route.ts
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
    const { customer_id, action } = await request.json();
    // action: 'ban' | 'unban'

    console.log('Customer status request:', { customer_id, action })

    if (!customer_id || !action || !['ban', 'unban'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid customer_id/action' },
        { status: 400 }
      );
    }

    const isBanned = action === 'ban';

    // 3) Create admin client (bypass RLS)
    const adminClient: SupabaseClient<Database> = await createAdminClient();

    // 4) Update the customer status
    const { error } = await adminClient
      .from('customers')
      .update({ is_banned: isBanned })
      .eq('customer_id', customer_id);

    if (error) {
      console.error('Update status error:', error);
      return NextResponse.json(
        { error: 'Failed to update customer status' },
        { status: 500 }
      );
    }

    // 5) Success response
    return NextResponse.json({
      message: `Customer has been ${isBanned ? 'banned' : 'unbanned'} successfully`,
      customer_id,
      status: isBanned ? 'banned' : 'active',
    });

  } catch (err) {
    console.error('Error in PATCH customer-status:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
