import { createClient } from '@/utils/supabase/server';
import { getChatsByUserId, getUser } from '@/utils/supabase/queries';

export async function GET() {
  const supabase = await createClient();

  const user = await getUser(supabase);

  if (!user || !user.id) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const chats = await getChatsByUserId(supabase);
  return Response.json(chats);
}
