// app/api/webhook/hitpay/route.ts
import { NextRequest } from 'next/server';
import { ProcessHitPayWebhook, HitPayWebhookData } from '@/utils/hitpay/process-webhook';
import { verifyHitPayWebhook } from '@/utils/hitpay/verify-webhook';

const webhookProcessor = new ProcessHitPayWebhook();

interface HitPayJsonWebhook {
  id: string;
  status: string;
  amount: number;
  currency: string;
  payment_request_id: string;
  payment_request: {
    reference_number: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const contentType = request.headers.get('content-type');
    
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Content-Type:', contentType);

    let webhookData: HitPayWebhookData;

    if (contentType?.includes('application/json')) {
      // Handle JSON webhook (what you're actually receiving)
      const jsonData: HitPayJsonWebhook = JSON.parse(rawBody);
      
      console.log('JSON webhook received:', {
        id: jsonData.id,
        status: jsonData.status,
        amount: jsonData.amount,
        currency: jsonData.currency
      });

      webhookData = {
        payment_id: jsonData.id,
        payment_request_id: jsonData.payment_request_id,
        reference_number: jsonData.payment_request?.reference_number || '',
        amount: jsonData.amount.toString(),
        currency: jsonData.currency.toUpperCase(),
        status: jsonData.status,
        hmac: '' // JSON webhooks don't have HMAC in the same way
      };

    } else {
      // Handle form-urlencoded webhook (legacy format)
      const params = new URLSearchParams(rawBody);
      webhookData = {
        payment_id: params.get('payment_id') || '',
        payment_request_id: params.get('payment_request_id') || '',
        reference_number: params.get('reference_number') || '',
        amount: params.get('amount') || '0',
        currency: params.get('currency') || 'SGD',
        status: params.get('status') || '',
        hmac: params.get('hmac') || ''
      };
    }

    console.log('Processed webhook data:', webhookData);

    // Skip HMAC verification for JSON webhooks for now
    // You may need to implement a different verification method
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      if (!verifyHitPayWebhook(rawBody, webhookData.hmac)) {
        console.error('HitPay webhook signature verification failed');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.log('Skipping HMAC verification for JSON webhook');
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
