import { createClient } from '@/utils/supabase/server';
import { getHitPayCustomerId } from '@/utils/hitpay/get-customer-ids';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = await getHitPayCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { data, error } = await supabase.rpc('get_grace_period_data', { p_customer_id: customerId });
    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch grace period data' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
