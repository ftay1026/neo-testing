// app/app/(account)/checkout/page.tsx - Updated for HitPay
import { CheckoutHeader } from '@/components/checkout/checkout-header';
import { HitPayCheckoutContents } from '@/components/checkout/hitpay-checkout-contents';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

interface CheckoutPageProps {
  searchParams: Promise<{ tier?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data.user) {
    redirect('/sign-in');
  }

  const { tier } = await searchParams;

  return (
    <div className="w-full min-h-screen relative overflow-hidden">
      <div className="mx-auto max-w-6xl relative px-[16px] md:px-[32px] py-[24px] flex flex-col gap-6 justify-between">
        <CheckoutHeader />
        <div className="flex-1 flex items-center justify-center">
          <HitPayCheckoutContents 
            userEmail={data.user.email || undefined}
            preselectedTierId={tier}
          />
        </div>
      </div>
    </div>
  );
}