import { createAdminClient, createClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';

export async function GET(request: Request) {
  try {
    // normal client to check admin user
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    console.log('Admin user:', user);
    console.log('Admin allowed emails:', process.env.ADMIN_EMAILS);

      // Admin check
    // if (user?.email !== process.env.ADMIN_EMAILS || user == null) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // admin client (service role) needed for RPC
    const supabaseAdmin: SupabaseClient<Database> = await createAdminClient();

    // Call the unified dashboard RPC function
    const { data, error } = await supabaseAdmin.rpc('admin_dashboard_all');

    console.log('Dashboard RPC result:', data);

    if (error) {
      console.error('Error in admin_dashboard_all RPC:', error);
      return NextResponse.json(
        { error: 'Failed to load dashboard data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ dashboard: data });

  } catch (err) {
    console.error('Server error in GET /admin/dashboard:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
