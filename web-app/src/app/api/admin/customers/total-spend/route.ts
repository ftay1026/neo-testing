// /app/api/admin/customer/total-spend/route.ts
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getUser } from '@/utils/supabase/queries';

export async function POST(request: Request) {
  try {
    // 1) Authenticate user
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    // Uncomment to enforce admin authentication
    // if (!user || user.email !== process.env.ADMIN_EMAILS) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // 2) Read request payload
    const { customer_id } = await request.json();


    console.log('Customer total spend request:', { customer_id })
    
    if (!customer_id) {
      return NextResponse.json(
        { error: 'Missing customer_id' },
        { status: 400 }
      );
    }

    // 3) Create admin client (bypass RLS)
    const adminClient: SupabaseClient<Database> = await createAdminClient();

    // 4) Get total spend from package_transactions
    const { data, error } = await adminClient
      .from('package_transaction')
      .select('amount')
      .eq('customer_id', customer_id);

    if (error) {
      console.error('Error fetching total spend:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer spend data' },
        { status: 500 }
      );
    }

    // 5) Calculate total spend
    const totalSpend = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;

    // 6) Success response
    return NextResponse.json({
      customer_id,
      total_spend: totalSpend,
      transaction_count: data?.length || 0,
    });

  } catch (err) {
    console.error('Error in POST customer total-spend:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}