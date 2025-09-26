// import { CheckoutGradients } from '@/components/gradients/checkout-gradients';
// import '../checkout.css';
import { CheckoutHeader } from '@/components/checkout/checkout-header';
import { CheckoutContents } from '@/components/checkout/checkout-contents';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect('/sign-in');
  }

  return (
    <div className={'w-full min-h-screen relative overflow-hidden'}>
      {/* <CheckoutGradients /> */}
      <div
        className={'mx-auto max-w-6xl relative px-[16px] md:px-[32px] py-[24px] flex flex-col gap-6 justify-between'}
      >
        <CheckoutHeader />
        <CheckoutContents userEmail={data.user?.email} />
      </div>
    </div>
  );
}
