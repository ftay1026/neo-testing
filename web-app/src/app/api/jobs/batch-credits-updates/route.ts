import { createClient as createAdminClient } from '@/utils/supabase/admin';
import { redisCreditTracker, type CreditUsageRecord } from '@/lib/services/credit-service';
import { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

// Verify this is a legitimate cron request
function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('⚠️ CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verify cron authentication
  if (!isValidCronRequest(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();
  console.log('🔄 Starting credit sync job...');

  try {
    // 1. Health check Redis
    const redisHealthy = await redisCreditTracker.ping();
    if (!redisHealthy) {
      throw new Error('Redis connection failed');
    }

    // 2. Get all usage records from Redis
    const records = await redisCreditTracker.getAllUsageRecords();
    
    if (records.length === 0) {
      console.log('✅ No pending records to sync');
      return Response.json({
        success: true,
        message: 'No records to sync',
        recordsProcessed: 0,
        duration: Date.now() - startTime
      });
    }

    console.log(`📦 Found ${records.length} records to process`);

    // 3. Group records by customer for batch processing
    const customerGroups = new Map<string, CreditUsageRecord[]>();
    records.forEach(record => {
      const existing = customerGroups.get(record.customerId) || [];
      existing.push(record);
      customerGroups.set(record.customerId, existing);
    });

    console.log(`👥 Processing ${customerGroups.size} customers`);

    // 4. Process each customer's records
    const supabaseAdmin: SupabaseClient<Database> = await createAdminClient();
    let totalProcessed = 0;
    const errors: Array<{ customerId: string; error: string }> = [];

    for (const [customerId, customerRecords] of customerGroups) {
      try {
        // Calculate total credits for this customer
        const totalCredits = customerRecords.reduce(
          (sum, r) => sum + r.actualCreditsUsed, 
          0
        );

        // Single database operation per customer
        const { error: dbError } = await supabaseAdmin.rpc('add_credits', {
          p_customer_id: customerId,
          p_amount: -totalCredits, // Negative for deduction
          p_description: `Batch credit usage: ${customerRecords.length} messages (${totalCredits} credits)`
        });

        if (dbError) {
          throw dbError;
        }

        // Delete processed records from Redis
        await redisCreditTracker.deleteUsageRecords(customerRecords);
        
        totalProcessed += customerRecords.length;
        console.log(`✅ Synced ${customerRecords.length} records for ${customerId} (${totalCredits} credits)`);

      } catch (error) {
        console.error(`❌ Failed to process customer ${customerId}:`, error);
        errors.push({
          customerId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue processing other customers
      }
    }

    const duration = Date.now() - startTime;
    const result = {
      success: errors.length === 0,
      recordsProcessed: totalProcessed,
      customersProcessed: customerGroups.size,
      errors: errors.length > 0 ? errors : undefined,
      duration
    };

    console.log(`✅ Credit sync completed in ${duration}ms`);
    console.log(`📊 Processed: ${totalProcessed}/${records.length} records`);
    
    if (errors.length > 0) {
      console.error(`⚠️ ${errors.length} customers had errors`);
    }

    return Response.json(result);

  } catch (error) {
    console.error('❌ Credit sync job failed:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}