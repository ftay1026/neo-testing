import { createAdminClient, createClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';

export async function GET(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    console.log('Admin user:', user)
    console.log('Admin email env var:', process.env.ADMIN_EMAIL)
    
    // Admin check
    // if (user?.email !== process.env.ADMIN_EMAILS || user == null) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Get days threshold from query params (default: 30)
    const { searchParams } = new URL(request.url);
    const daysThreshold = parseInt(searchParams.get('days') || '90');
    
    // Call the RPC function
    const supabaseAdminClient: SupabaseClient<Database> = await createAdminClient();
    const { data, error } = await supabaseAdminClient.rpc('get_expiring_credits', {
      p_days_threshold: daysThreshold
    });
    
    console.log('Expiring credits data:', data);
    if (error) {
      console.error('Error fetching expiring credits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expiring credits' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ credits: data });
    
  } catch (error) {
    console.error('Error in GET expiring credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
