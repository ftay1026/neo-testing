// utils/hitpay/get-hitpay-instance.ts
export interface HitPayConfig {
  apiKey: string;
  baseUrl: string;
}

export function getHitPayInstance(): HitPayConfig {
  const isProduction = process.env.NEXT_PUBLIC_HITPAY_ENV === 'production';
  
  return {
    apiKey: process.env.HITPAY_API_KEY!,
    baseUrl: isProduction 
      ? 'https://api.hit-pay.com/v1' 
      : 'https://api.sandbox.hit-pay.com/v1'
  };
}