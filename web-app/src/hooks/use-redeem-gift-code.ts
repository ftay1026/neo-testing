// src/hooks/use-redeem-gift-code.ts
'use client';

import { useState } from 'react';

interface RedeemResult {
  success: boolean;
  message: string;
  credits_received?: number;
  new_balance?: number;
}

export function useRedeemGiftCode() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const redeemCode = async (code: string): Promise<RedeemResult | null> => {
    if (!code.trim()) {
      setMessage('Please enter a code.');
      return null;
    }

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch('/api/redeem-free-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!res.ok) {
        const text = await res.text();
        setMessage(text || 'Failed to redeem code.');
        return null;
      }

      const data: RedeemResult = await res.json();
      setMessage(data.message || (data.success ? 'Redeemed successfully!' : 'Failed to redeem code.'));
      return data;
    } catch (err) {
      console.error(err);
      setMessage('Server error. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { redeemCode, loading, message, setMessage };
}
