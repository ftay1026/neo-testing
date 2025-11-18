import { createAdminClient, createClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';

export async function GET(request: Request) {
  try {
    // -----------------------------------------
    // 1. Auth: Verify admin user
    // -----------------------------------------
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    console.log('Admin user:', user);
    console.log('Admin allowed emails:', process.env.ADMIN_EMAILS);

    
      // Admin check
    // if (user?.email !== process.env.ADMIN_EMAILS || user == null) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }


    // -----------------------------------------
    // 2. Admin client for running SQL function
    // -----------------------------------------
    const supabaseAdmin: SupabaseClient<Database> = await createAdminClient();

    // Call your new PL/pgSQL dashboard function
    const { data, error } = await supabaseAdmin.rpc('admin_sales_dashboard');

    console.log('admin_sales_dashboard result:', data);

    if (error) {
      console.error('Error in admin_sales_dashboard RPC:', error);
      return NextResponse.json(
        { error: 'Failed to load sales dashboard data' },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 3. Return successful response
    // -----------------------------------------
    return NextResponse.json({ dashboard: data });

  } catch (err) {
    console.error('Server error in GET /admin/sales-dashboard:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
