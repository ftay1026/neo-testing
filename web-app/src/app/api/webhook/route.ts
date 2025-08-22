import { NextRequest } from 'next/server';
import { ProcessWebhook } from '@/utils/paddle/process-webhook';
import { getPaddleInstance } from '@/utils/paddle/get-paddle-instance';

const webhookProcessor = new ProcessWebhook();

export async function POST(request: NextRequest) {
  const signature = request.headers.get('paddle-signature') || '';
  const rawRequestBody = await request.text();
  const privateKey = process.env['PADDLE_NOTIFICATION_WEBHOOK_SECRET'] || '';

  // DEBUG: Debug5: Checking signature and rawRequestBody
  console.log('Debug5: Checking signature and rawRequestBody');
  console.log('---');
  console.log('signature:', signature);
  console.log('rawRequestBody:', rawRequestBody);
  console.log('privateKey:', privateKey);
  console.log('---');

  let status, eventName;
  try {
    if (signature && rawRequestBody) {
      const paddle = getPaddleInstance();
      const eventData = await paddle.webhooks.unmarshal(rawRequestBody, privateKey, signature);

      // DEBUG: Debug1: Checking eventData, and eventName
      console.log(
        'Debug1: Debugging webhook route, to understand which event has triggered, and what is going to happen',
      );
      console.log('---');
      console.log('eventData:');
      console.log(eventData);
      console.log('---');
      console.log('eventName:');
      console.log(eventData?.eventType ?? 'Unknown event');
      console.log('---');

      status = 200;
      eventName = eventData?.eventType ?? 'Unknown event';
      if (eventData) {
        await webhookProcessor.processEvent(eventData);
      }
    } else {
      status = 400;
      console.log('Missing signature from header');
    }
  } catch (e) {
    // Handle error
    status = 500;
    console.log(e);
  }
  return Response.json({ status, eventName });
}
