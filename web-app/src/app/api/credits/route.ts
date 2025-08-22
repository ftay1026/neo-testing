import { createClient } from '@/utils/supabase/server';
import { getCustomerId } from '@/utils/paddle/get-customer-id';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
export async function GET() {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const customerId = await getCustomerId();
    console.log('Retrieved customerId:', customerId);

    if (!customerId) {
      return new Response('Customer record not found', { status: 404 });
    }

    const { data: credits, error } = await supabase
      .from('credits')
      .select('credits')
      .eq('customer_id', customerId)
      .maybeSingle();

    console.log('Credits query result:', { data: credits, error });

    if (error) {
      console.error('Error fetching credits:', error);
      return new Response('Error fetching credits', { status: 500 });
    }

    const responseCredits = credits?.credits ?? 0;
    console.log('Returning credits value:', responseCredits);
    return Response.json({ credits: responseCredits });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
} 