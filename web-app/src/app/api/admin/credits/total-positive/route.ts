import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
    try {
        const supabase: SupabaseClient<Database> = await createClient();
        const user = await getUser(supabase);

        // Admin check
        if (user?.email !== process.env.ADMIN_EMAILS || user == null) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Call the RPC function
        const supabaseAdminClient: SupabaseClient<Database> = await createAdminClient();
        const { data, error } = await supabaseAdminClient.rpc('get_total_positive_credits');

        console.log('Total positive credits data:', data);
        if (error) {
            console.error('Error fetching total credits:', error);
            return NextResponse.json(
                { error: 'Failed to fetch total credits' },
                { status: 500 }
            );
        }

        return NextResponse.json({ total: data });

    } catch (error) {
        console.error('Error in GET total positive credits:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
