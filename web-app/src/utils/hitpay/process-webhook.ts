// utils/hitpay/process-webhook.ts
import { createClient } from '@/utils/supabase/admin';
import { HitPayPricingTiers } from '@/components/checkout/hitpay-pricing-constants';
import type { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export interface HitPayWebhookData {
  payment_id: string;
  payment_request_id: string;
  reference_number?: string;
  amount: string;
  currency: string;
  status: string;
  hmac: string;
}

export class ProcessHitPayWebhook {
  async processPaymentEvent(eventData: HitPayWebhookData) {
    try {
      const supabase: SupabaseClient<Database> = await createClient();

      // Only process succeeded payments
      if (eventData.status !== 'succeeded') {
        console.log(`Payment ${eventData.payment_id} status: ${eventData.status} - skipping`);
        return;
      }

      // Use reference_number as customer identifier (should be user email in hitpay)
      const customerEmail = eventData.reference_number?.trim();

      if (!customerEmail || !customerEmail.includes('@')) {
        console.error('Invalid or missing customer email in webhook reference_number:', eventData.reference_number);
        throw new Error('Customer email not found in webhook data');
      }

      console.log(`Processing payment for email: ${customerEmail}`);

      // Get user_id from auth.users using the helper function
      // HINT: The postgres function 'get_user_id_by_email' access is granted to anon, authenticated, and service_role roles since it only returns user_id. 
      // TODO: This needs to be checked for security implications.
      const { data: userId, error: userError } = await supabase
        .rpc('get_user_id_by_email', { p_email: customerEmail });

      if (userError) {
        console.error(`Error querying auth.users for email ${customerEmail}:`, userError);
        throw new Error(`Failed to query user account: ${userError.message}`);
      }

      if (!userId) {
        console.error(`User not found for email: ${customerEmail}`);
        throw new Error(`User account not found for email: ${customerEmail}`);
      }

      console.log(`Found user_id: ${userId} for email: ${customerEmail}`);

      // Check if customer exists, create/update if needed
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('customer_id, email, user_id')
        .eq('customer_id', customerEmail) // HitPay uses email as customer_id
        .maybeSingle();

      if (!existingCustomer) {
        console.log('Customer not found, creating new entry...');
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            customer_id: customerEmail, // HitPay customer_id (email)
            email: customerEmail,
            user_id: userId, // Link to auth user
          });

        if (insertError) {
          console.error('Failed to create new customer record:', insertError);
          throw new Error('Failed to create new customer record');
        }
      } else if (!existingCustomer.user_id) {
        // Backfill user_id if it's missing
        console.log('Updating customer record with user_id...');
        const { error: updateError } = await supabase
          .from('customers')
          .update({ 
            user_id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerEmail);

        if (updateError) {
          console.error('Failed to update customer with user_id:', updateError);
        }
      }

      // Calculate credits based on amount
      const amountInCents = Math.round(parseFloat(eventData.amount) * 100);
      
      // Find matching tier by amount
      const matchingTier = HitPayPricingTiers.find(tier => tier.amount === amountInCents);
      
      let creditsPurchased: number;
      let description: string;
      
      if (matchingTier) {
        creditsPurchased = matchingTier.credits;
        description = `HitPay purchase: ${matchingTier.name} (${creditsPurchased} credits) - Payment ID: ${eventData.payment_id}`;
        console.log(`Matched tier: ${matchingTier.name} for ${amountInCents} cents`);
      } else {
        // Fallback: 10 credits per dollar
        creditsPurchased = Math.floor(parseFloat(eventData.amount) * 10);
        description = `HitPay purchase: Custom amount (${creditsPurchased} credits) - Payment ID: ${eventData.payment_id}`;
        console.log(`No matching tier for ${amountInCents} cents, using fallback: ${creditsPurchased} credits`);
      }

      // Add credits using email as customer_id (HitPay pattern)
      const { error: creditsError } = await supabase.rpc('add_credits', {
        p_customer_id: customerEmail, // Use email as customer_id
        p_amount: creditsPurchased,
        p_description: description
      });

      if (creditsError) {
        console.error('Failed to add credits:', creditsError);
        throw new Error('Failed to add credits to customer account');
      }

      console.log(`✅ Successfully processed payment ${eventData.payment_id}:`);
      console.log(`   - Email: ${customerEmail}`);
      console.log(`   - User ID: ${userId}`);
      console.log(`   - Credits added: ${creditsPurchased}`);
      console.log(`   - Amount: ${eventData.currency} ${eventData.amount}`);

    } catch (error) {
      console.error('Error processing HitPay webhook:', error);
      throw error; // Re-throw so webhook returns 500 and HitPay retries
    }
  }
}