import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return NextResponse.json({ success: true, data: [] }, { status: 200 });

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[API NOTIFICATIONS] Fetch error:', error);
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error('[API NOTIFICATIONS] Error:', err);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}
