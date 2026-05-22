import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID required.' }, { status: 200 });

    const { data, error } = await supabaseAdmin
      .from('vehicle_operations')
      .select('*, vehicle:vehicles(name, registration_number), booking:bookings(user:profiles(name))')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[API OPERATIONS GET] DB Error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch operations.' }, { status: 200 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error('[API OPERATIONS GET] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch operations.' }, { status: 200 });
  }
}
