// /app/api/gift-codes/redeem/route.ts

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { getHitPayCustomerId } from '@/utils/hitpay/get-customer-ids';
import { SupabaseClient } from '@supabase/supabase-js'
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';

export async function POST(request: Request) {
  try {
      const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);
    
    
    
    if (user?.email != process.env.ADMIN_EMAILS || user == null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const customerId = await getHitPayCustomerId();
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }
    
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { error: 'Please enter a valid gift code' },
        { status: 400 }
      );
    }
    
    // Get IP address and user agent for tracking
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Redeem gift code
    const supabaseAdminClient: SupabaseClient<Database> = await createAdminClient();
    const { data, error } = await supabaseAdminClient.rpc('redeem_gift_code', {
      p_customer_id: customerId,
      p_user_id: user.id,
      p_code: code.trim(),
      p_ip_address: ip,
      p_user_agent: userAgent
    });
    
    if (error) {
      console.error('Error redeeming gift code:', error);
      return NextResponse.json(
        { error: 'Failed to redeem gift code. Please try again.' },
        { status: 500 }
      );
    }
    
    const result = data[0];
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      creditsReceived: result.credits_received,
      newBalance: result.new_balance
    });
    
  } catch (error) {
    console.error('Error in redeem gift code API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}