import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);
    
    // Admin check
    if (user?.email !== process.env.ADMIN_EMAILS || user == null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get days threshold from query params (default: 30)
    const { searchParams } = new URL(request.url);
    const daysThreshold = parseInt(searchParams.get('days') || '30');
    
    // Call the RPC function
    const supabaseAdminClient: SupabaseClient<Database> = await createAdminClient();
    const { data, error } = await supabaseAdminClient.rpc('get_total_expiring_credits', {
      p_days_threshold: daysThreshold
    });
    
    if (error) {
      console.error('Error fetching total expiring credits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch total expiring credits' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ total: data });
    
  } catch (error) {
    console.error('Error in GET total expiring credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
