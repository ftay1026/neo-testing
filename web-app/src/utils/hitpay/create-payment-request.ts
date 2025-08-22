// utils/hitpay/create-payment-request.ts
import { getHitPayInstance } from './get-hitpay-instance';

export interface CreatePaymentRequestParams {
  amount: number;
  currency: string;
  email?: string;
  name?: string;
  reference_number?: string;
  redirect_url: string;
  webhook: string;
  purpose?: string;
}

export async function createPaymentRequest(params: CreatePaymentRequestParams) {
  const config = getHitPayInstance();
  
  // HitPay expects form-encoded data, not JSON
  const formData = new URLSearchParams({
    amount: (params.amount / 100).toFixed(2), // HitPay expects amount in dollars, not cents
    currency: params.currency,
    redirect_url: params.redirect_url,
    webhook: params.webhook,
    purpose: params.purpose || 'Coaching Credits Purchase',
  });

  // Add optional fields only if they exist
  if (params.email) formData.append('email', params.email);
  if (params.name) formData.append('name', params.name);
  if (params.reference_number) formData.append('reference_number', params.reference_number);
  
  // Add payment methods
  formData.append('payment_methods[]', 'card');
  // formData.append('payment_methods[]', 'paynow_online');

  const response = await fetch(`${config.baseUrl}/payment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-BUSINESS-API-KEY': config.apiKey,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData
  });

  if (!response.ok) {
    // Get more detailed error information
    let errorMessage = `HitPay API error: ${response.statusText}`;
    try {
      const errorBody = await response.text();
      console.error('HitPay API error response:', errorBody);
      errorMessage += ` - ${errorBody}`;
    } catch (e) {
      console.error('Could not parse error response:', e);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}