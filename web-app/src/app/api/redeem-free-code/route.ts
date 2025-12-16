// src/app/api/redeme-free-code/route.ts
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);

    if (!user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { code } = await request.json();

    if (!code?.trim()) {
      return new Response('Gift code is required', { status: 400 });
    }


      // Get IP address and user agent for tracking
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';


    // Call your redeem_gift_code Postgres function
    const { data, error } = await supabase.rpc('redeem_gift_code', {
      p_customer_id: user.email!,
      p_user_id: user.id,
      p_code: code.trim().toUpperCase(),
      p_ip_address: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error('Error redeeming gift code:', error);
      return new Response('Error redeeming gift code', { status: 500 });
    }

    if (!data || !data.length) {
      return new Response('Gift code could not be redeemed', { status: 400 });
    }

    // The function returns success, message, credits_received, new_balance
    const result = data[0];

    return Response.json(result);
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response('An error occurred', { status: 500 });
  }
}
