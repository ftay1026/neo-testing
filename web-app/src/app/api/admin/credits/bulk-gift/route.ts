import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient, createClient } from '@/utils/supabase/admin';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';

export async function POST(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    console.log('Admin user:', user);
    console.log('Admin email env var:', process.env.ADMIN_EMAILS);

    // Admin authentication
    if (user?.email !== process.env.ADMIN_EMAILS || user == null) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Read the JSON body
    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a number.' },
        { status: 400 }
      );
    }

    // Admin client (service role)
    const supabaseAdminClient: SupabaseClient<Database> = await createAdminClient();

    // Call DB RPC (bulk gift function)
    const { error } = await supabaseAdminClient.rpc('admin_bulk_gift_from_credits', {
      p_amount: amount
    });

    if (error) {
      console.error('Bulk gift failed:', error);
      return NextResponse.json(
        { error: 'Failed to apply bulk gift credits.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully gifted ${amount} credits to all customers.`,
    });

  } catch (error) {
    console.error('Bulk gift API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
