// app/api/checkout/hitpay/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { createPaymentRequest } from '@/utils/hitpay/create-payment-request';
import { getURL } from '@/lib/utils';
import { getTierById } from '@/components/checkout/hitpay-pricing-constants';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tierId } = await request.json();

    // Validate the request
    if (!tierId) {
      return Response.json({ error: 'Missing tier ID' }, { status: 400 });
    }

    // Get the pricing tier
    const selectedTier = getTierById(tierId);
    
    if (!selectedTier) {
      return Response.json({ error: 'Invalid tier ID' }, { status: 400 });
    }

    console.log('Creating payment request for:', {
      tierId,
      tierName: selectedTier.name,
      amount: selectedTier.amount,
      currency: selectedTier.currency,
      userEmail: user.email
    });

    // Create payment request with HitPay
    const paymentRequest = await createPaymentRequest({
      amount: selectedTier.amount, // amount in cents
      currency: selectedTier.currency,
      email: user.email || undefined,
      name: user.email || 'Customer',
      reference_number: user.email || `customer-${user.id}`,
      redirect_url: getURL('/app/checkout/success'),
      webhook: getURL('/api/webhook/hitpay'),
      purpose: `Purchase: ${selectedTier.name} (${selectedTier.credits} credits)`
    });

    console.log('HitPay payment request created successfully:', {
      id: paymentRequest.id,
      url: paymentRequest.url
    });

    // Return the checkout URL to the client
    return Response.json({
      checkoutUrl: paymentRequest.url,
      paymentRequestId: paymentRequest.id,
      tierInfo: {
        name: selectedTier.name,
        credits: selectedTier.credits,
        amount: selectedTier.amount / 100 // Convert back to dollars for display
      }
    });

  } catch (error) {
    console.error('HitPay payment request creation error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create payment request';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}