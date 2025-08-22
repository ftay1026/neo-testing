// app/api/webhook/hitpay/route.ts
import { NextRequest } from 'next/server';
import { ProcessHitPayWebhook, HitPayWebhookData } from '@/utils/hitpay/process-webhook';
import { verifyHitPayWebhook } from '@/utils/hitpay/verify-webhook';

const webhookProcessor = new ProcessHitPayWebhook();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    
    // Parse the form data
    const params = new URLSearchParams(rawBody);
    const webhookData: HitPayWebhookData = {
      payment_id: params.get('payment_id') || '',
      payment_request_id: params.get('payment_request_id') || '',
      reference_number: params.get('reference_number') || '',
      amount: params.get('amount') || '0',
      currency: params.get('currency') || 'SGD',
      status: params.get('status') || '',
      hmac: params.get('hmac') || ''
    };

    console.log('HitPay webhook received:', {
      payment_id: webhookData.payment_id,
      amount: webhookData.amount,
      status: webhookData.status
    });

    // Verify webhook signature
    if (!verifyHitPayWebhook(rawBody, webhookData.hmac)) {
      console.error('HitPay webhook signature verification failed');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process the webhook
    await webhookProcessor.processPaymentEvent(webhookData);

    return Response.json({ 
      status: 200, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('HitPay webhook processing error:', error);
    return Response.json({ 
      error: 'Webhook processing failed' 
    }, { status: 500 });
  }
}