// components/pricing/hitpay-pricing.tsx - Simplified pricing component
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HitPayPricingTiers } from '@/components/checkout/hitpay-pricing-constants';
import Link from 'next/link';
import { CircleCheck } from 'lucide-react';

export function HitPayPricing() {
  return (
    <div className="flex flex-row flex-wrap gap-8 max-w-7xl mx-auto justify-center">
      {HitPayPricingTiers.map((tier) => (
        <Card key={tier.id} className="flex-1 max-w-xs min-w-[340px] flex flex-col bg-background/70 backdrop-blur-[6px] overflow-hidden">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
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
            <div className="text-4xl font-bold">
              ${(tier.amount / 100).toFixed(0)}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {tier.currency}
              </span>
            </div>
            <div className="text-muted-foreground">
              {tier.credits.toLocaleString()} credits
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              {tier.description}
            </p>
            
            <div className="space-y-2 mb-6">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CircleCheck className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <Button className="w-full mt-auto" asChild>
              <Link href={`/app/checkout?tier=${tier.id}`}>
                Purchase Credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}