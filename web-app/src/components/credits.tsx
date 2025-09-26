'use client';
import { HitPayPricing } from '@/components/pricing/hitpay-pricing';
import { useCredits } from '@/hooks/use-credits';

export function Credits() {
  const { credits, isLoading } = useCredits();

  return (
    <div className="flex flex-col gap-10 items-center justify-center w-full">
      <div className="flex flex-col gap-5 self-start w-full">
        <h1 className="text-3xl font-semibold">Credits</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Loading credits..."
          ) : (
            `You have ${credits} credits remaining.`
          )}
        </p>
      </div>

      <HitPayPricing />
    </div>
  );
}