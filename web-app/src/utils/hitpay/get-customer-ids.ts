// utils/hitpay/get-customer-id.ts
import { createClient } from '@/utils/supabase/server';

export async function getHitPayCustomerId() {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  
  if (user.data.user?.email) {
    // For HitPay, we'll use email as the customer identifier
    // You can also create a mapping table if needed
    const customersData = await supabase
      .from('customers')
      .select('customer_id, email')
      .eq('email', user.data.user.email)
      .single();
    
    if (customersData?.data?.customer_id) {
      return customersData.data.customer_id;
    } else {
      // Return email as customer ID for new customers
      return user.data.user.email;
    }
  }
  return '';
}