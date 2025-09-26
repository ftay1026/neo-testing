// utils/hitpay/verify-webhook.ts
import crypto from 'crypto';

export function verifyHitPayWebhook(payload: string, receivedHmac: string): boolean {
  const webhookSalt = process.env.HITPAY_WEBHOOK_SALT!;
  
  // Parse the payload as URL-encoded data
  const params = new URLSearchParams(payload);
  const data: Record<string, string> = {};
  
  // Convert to object and exclude hmac
  for (const [key, value] of params.entries()) {
    if (key !== 'hmac') {
      data[key] = value;
    }
  }
  
  // Create signature string as per HitPay documentation
  // Sort keys and concatenate key+value pairs
  const hmacSource: string[] = [];
  Object.keys(data).sort().forEach(key => {
    hmacSource.push(`${key}${data[key]}`);
  });
  
  const calculatedHmac = crypto
    .createHmac('sha256', webhookSalt)
    .update(hmacSource.join(''))
    .digest('hex');
  
  return calculatedHmac === receivedHmac;
}