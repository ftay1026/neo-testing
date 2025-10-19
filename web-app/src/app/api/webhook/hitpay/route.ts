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
    
    console.log('=== HitPay WEBHOOK RECEIVED ===');
    console.log('Content-Type:', contentType);
    
    let webhookData: HitPayWebhookData;

    if (contentType?.includes('application/json')) {
      // Handle JSON webhook (what you're actually receiving)
      const jsonData: HitPayJsonWebhook = JSON.parse(rawBody);
      
      console.log('JSON webhook data:', {
        payment_id: jsonData.id,
        status: jsonData.status,
        amount: jsonData.amount,
        currency: jsonData.currency,
        reference: jsonData.payment_request?.reference_number
      });

      webhookData = {
        payment_id: jsonData.id,
        payment_request_id: jsonData.payment_request_id,
        reference_number: jsonData.payment_request?.reference_number || '',
        amount: jsonData.amount.toString(),
        currency: jsonData.currency.toUpperCase(),
        status: jsonData.status,
        hmac: '' // JSON webhooks don't have HMAC
      };

      // Validate reference_number contains email
      if (!webhookData.reference_number || !webhookData.reference_number.includes('@')) {
        console.error('Invalid reference_number (must be email):', webhookData.reference_number);
        return Response.json({ 
          error: 'Invalid reference_number format' 
        }, { status: 400 });
      }

    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Handle form-urlencoded webhook
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

      console.log('Form-encoded webhook data:', webhookData);

      // Verify HMAC for form-encoded webhooks
      if (!verifyHitPayWebhook(rawBody, webhookData.hmac)) {
        console.error('❌ HMAC verification failed');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ HMAC verification passed');

    } else {
      console.error('Unsupported content type:', contentType);
      return Response.json({ 
        error: 'Unsupported content type' 
      }, { status: 400 });
    }

    // Process the webhook
    await webhookProcessor.processPaymentEvent(webhookData);

    console.log('=== HitPay WEBHOOK PROCESSED SUCCESSFULLY ===\n');
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
