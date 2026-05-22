import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 200 });

    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API NOTIFICATION MARK-READ] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to mark as read.' }, { status: 200 });
  }
}
