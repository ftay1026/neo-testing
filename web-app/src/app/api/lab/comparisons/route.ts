import { createClient } from '@/utils/supabase/server';
import { getComparisons, createComparison } from '@/utils/supabase/queries-lab';
import { getUser } from '@/utils/supabase/queries';
import { isAdminUser } from '@/lib/utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export async function GET() {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id || !isAdminUser(user.email)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const comparisons = await getComparisons(supabase);
    return Response.json(comparisons);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return new Response('Error fetching comparisons', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id || !isAdminUser(user.email)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const comparisonData = await request.json();
    const comparison = await createComparison(supabase, comparisonData);
    
    return Response.json(comparison);
  } catch (error) {
    console.error('Error creating comparison:', error);
    return new Response('Error creating comparison', { status: 500 });
  }
}