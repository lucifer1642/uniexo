import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req, user) => {
  if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  
  try {
    const { data, error } = await supabaseAdmin.from('payments').select('*, bookings(*)').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: { data } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});