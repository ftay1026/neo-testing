// components/checkout/hitpay-checkout-contents.tsx
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HitPayPricingTiers, HitPayTier } from '@/components/checkout/hitpay-pricing-constants';

interface HitPayCheckoutContentsProps {
  userEmail?: string;
  preselectedTierId?: string;
}

export function HitPayCheckoutContents({ userEmail, preselectedTierId }: HitPayCheckoutContentsProps) {
  const [selectedTier, setSelectedTier] = useState<HitPayTier>(() => {
    if (preselectedTierId) {
      return HitPayPricingTiers.find(t => t.id === preselectedTierId) || HitPayPricingTiers[0];
    }
    return HitPayPricingTiers[0];
  });
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Call our server-side API route instead of HitPay directly
      const response = await fetch('/api/checkout/hitpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId: selectedTier.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment request');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to HitPay checkout page
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received from server');
      }

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsLoading(false);
    }
  }, [selectedTier]);

  return (
    <div className="mx-auto max-w-2xl w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Your Credit Pack</h2>
        <p className="text-muted-foreground">Select the credit pack that best fits your needs</p>
      </div>

      {/* Tier Selection */}
      <div className="grid gap-4 mb-6">
        {HitPayPricingTiers.map((tier) => (
          <Card 
            key={tier.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedTier.id === tier.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedTier(tier)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{tier.name}</h3>
                    {tier.featured && (
                      <Badge variant="default" className="text-xs">
                        Most Popular
                      </Badge>
                    )}
                    {tier.savings && (
                      <Badge variant="secondary" className="text-xs">
                        {tier.savings}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold">
                    ${(tier.amount / 100).toFixed(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tier.credits.toLocaleString()} credits
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Button */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Selected: {selectedTier.name}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedTier.credits.toLocaleString()} credits for ${(selectedTier.amount / 100).toFixed(0)}
              </p>
              {userEmail && (
                <p className="text-xs text-muted-foreground mt-1">
                  Purchasing for: {userEmail}
                </p>
              )}
            </div>
            <Button 
              onClick={handlePayment}
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Redirecting to Payment...' : 'Pay with HitPay'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground mt-4">
        Secure payment powered by HitPay<br />
        Supports PayNow, Cards, Apple Pay, Google Pay
      </div>
    </div>
  );
}