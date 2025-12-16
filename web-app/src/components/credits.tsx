'use client';
import { useState } from 'react';
import { HitPayPricing } from '@/components/pricing/hitpay-pricing';
import { useCredits } from '@/hooks/use-credits';
import { useRedeemGiftCode } from '@/hooks/use-redeem-gift-code';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function Credits() {
  const { credits, isLoading } = useCredits();
  const { redeemCode, loading, message, setMessage } = useRedeemGiftCode();
  const [code, setCode] = useState('');

  const handleRedeem = async () => {
    const result = await redeemCode(code);
    if (result?.success) {
      setCode(''); // Clear input
    }
  };

  return (
    <div className="flex flex-col gap-10 items-center justify-center w-full">
      <div className="flex flex-col gap-5 self-start w-full max-w-md">
        <h1 className="text-3xl font-semibold">Credits</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading credits...' : `You have ${credits} credits remaining.`}
        </p>

        {/* Gift Code Redemption */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter gift code"
              className="flex-1 border p-2 rounded"
            />
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={handleRedeem}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Redeeming...' : 'Redeem'}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter a valid gift code to add free credits to your account.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {message && <p className="text-sm text-red-500">{message}</p>}
        </div>
      </div>

      <HitPayPricing />
    </div>
  );
}
