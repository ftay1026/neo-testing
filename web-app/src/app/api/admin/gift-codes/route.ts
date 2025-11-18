// /app/api/admin/gift-codes/route.ts

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js'
import { getUser } from '@/utils/supabase/queries';
import type { Database } from '@/types/database.types';

export async function GET() {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);
    
    
    
    // if (user?.email != process.env.ADMIN_EMAILS || user == null) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // TODO: Add admin role check here
    // const isAdmin = await checkIsAdmin(adminUser.id);
    // if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabaseAdminClient: SupabaseClient<Database> = await createAdminClient();
    const { data, error } = await supabaseAdminClient.rpc('get_all_gift_codes');
    
    if (error) {
      console.error('Error fetching gift codes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gift codes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ codes: data });
    
  } catch (error) {
    console.error('Error in GET gift codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase: SupabaseClient<Database> = await createClient();
    const user = await getUser(supabase);
    
    
    
    if (user?.email != process.env.ADMIN_EMAILS || user == null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // TODO: Add admin role check
    
    const body = await request.json();
    const { code, creditsAmount, maxUses, expiresAt, notes } = body;
    
    // Validation
    if (!code || !creditsAmount || creditsAmount <= 0) {
      return NextResponse.json(
        { error: 'Code and credits amount are required' },
        { status: 400 }
      );
    }
    
    // Create gift code
    const supabaseAdminClient: SupabaseClient<Database> = await createAdminClient();
    const { data, error } = await supabaseAdminClient.rpc('create_gift_code', {
      p_admin_user_id: user.id,
      p_code: code,
      p_credits_amount: creditsAmount,
      p_max_uses: maxUses || 1,
      p_expires_at: expiresAt || null,
      p_notes: notes || null
    });
    
    if (error) {
      console.error('Error creating gift code:', error);
      return NextResponse.json(
        { error: 'Failed to create gift code' },
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
      codeId: result.code_id
    });
    
  } catch (error) {
    console.error('Error in POST gift code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}