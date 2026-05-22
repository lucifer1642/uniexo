import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req: Request, user: any) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('vendor_id', user.userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API VENDOR VEHICLES GET] Error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch vehicles.' }, { status: 200 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error('[API VENDOR VEHICLES GET] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 200 });
  }
}, 'vendor');
