// utils/hitpay/process-webhook.ts
import { createClient } from '@/utils/supabase/admin';
import { HitPayPricingTiers } from '@/components/checkout/hitpay-pricing-constants';

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
      const supabase = await createClient();
      
      // Only process completed payments
      if (eventData.status !== 'completed') {
        console.log(`Payment ${eventData.payment_id} status: ${eventData.status}`);
        return;
      }

      // Use reference_number as customer identifier (should be user email)
      const customerEmail = eventData.reference_number;

      if (!customerEmail) {
        console.error('Customer email not found in webhook reference_number');
        return;
      }

      // Check if customer exists, create if needed
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('customer_id, email')
        .eq('email', customerEmail)
        .single();

      let customerId = customerEmail; // Default to email as customer ID

      if (!customer) {
        console.log('Customer not found, creating new entry...');
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            customer_id: customerEmail,
            email: customerEmail
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create new customer:', insertError);
          return;
        }
        customerId = newCustomer.customer_id;
      } else {
        customerId = customer.customer_id;
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
        console.log(`Processing HitPay payment webhook for customer ${customerId}`);
        console.log(`Matched tier: ${matchingTier.name} for amount ${amountInCents} cents`);
      } else {
        // Fallback: 10 credits per dollar
        creditsPurchased = Math.floor(parseFloat(eventData.amount) * 10);
        description = `HitPay purchase: Custom amount (${creditsPurchased} credits) - Payment ID: ${eventData.payment_id}`;
        console.log(`Processing HitPay payment webhook for customer ${customerId}`);
        console.log(`No matching tier found for amount ${amountInCents} cents, using fallback credits: ${creditsPurchased}`);
      }

      // Add credits using the existing function
      await supabase.rpc('add_credits', {
        p_customer_id: customerId,
        p_amount: creditsPurchased,
        p_description: description
      });

      console.log(`Successfully processed HitPay payment ${eventData.payment_id}: ${creditsPurchased} credits added to ${customerId}`);

    } catch (error) {
      console.error('Error processing HitPay webhook:', error);
      throw error;
    }
  }
}