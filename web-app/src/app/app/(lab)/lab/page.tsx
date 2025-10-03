import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/utils';
import { LabClient } from '@/components/lab/lab-client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export default async function LabPage() {
  const supabase: SupabaseClient<Database> = await createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect('/sign-in');
  }

  if (!isAdminUser(user.email)) {
    return redirect('/app');
  }

  return <LabClient />;
}