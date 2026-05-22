import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 200 });

    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API NOTIFICATION READ-ALL] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to mark all as read.' }, { status: 200 });
  }
}
