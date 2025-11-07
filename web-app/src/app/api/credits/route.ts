import { createClient } from '@/utils/supabase/server';
import { getHitPayCustomerId } from '@/utils/hitpay/get-customer-ids';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js'
import { redisCreditTracker } from '@/lib/services/credit-service';

export async function GET() {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const customerId = await getHitPayCustomerId();
    console.log('Retrieved customerId:', customerId);

    if (!customerId) {
      return new Response('Customer record not found', { status: 404 });
    }

    // const { data: credits, error } = await supabase
    //   .from('credits')
    //   .select('credits')
    //   .eq('customer_id', customerId)
    //   .maybeSingle();

    // console.log('Credits query result:', { data: credits, error });

    // if (error) {
    //   console.error('Error fetching credits:', error);
    //   return new Response('Error fetching credits', { status: 500 });
    // }

    // Parallel fetch
    const [creditsData, pendingDeductions] = await Promise.all([
      supabase
        .from('credits')
        .select('credits')
        .eq('customer_id', customerId)
        .maybeSingle(),
      redisCreditTracker.getPendingCredits(customerId)
    ]);

    if (creditsData.error) {
      console.error('Error fetching credits:', creditsData.error);
      return new Response('Error fetching credits', { status: 500 });
    }

    const dbBalance = creditsData.data?.credits ?? 0;
    const actualBalance = dbBalance - pendingDeductions;

    console.log(`Credits API: DB=${dbBalance}, Pending=${pendingDeductions}, Actual=${actualBalance}`);
    const responseCredits = Math.max(0, actualBalance);
    
    console.log('Returning credits value:', responseCredits);
    return Response.json({ credits: responseCredits });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('An error occurred', { status: 500 });
  }
} 