import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ success: true, data: [], total: 0 }, { status: 200 });

    // Get all bookings for this vendor that have payments
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('vendor_id', vendorId);

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, data: [], total: 0 }, { status: 200 });
    }

    const bookingIds = bookings.map((b: any) => b.id);

    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*, user:profiles!user_id(id, name, email, phone), booking:bookings!booking_id(id, service_type, total_amount, status, start_date, end_date)')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API VENDOR PAYMENTS] Error:', error);
      return NextResponse.json({ success: true, data: [], total: 0 }, { status: 200 });
    }

    const totalEarned = (payments || [])
      .filter((p: any) => p.status === 'captured')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return NextResponse.json({ success: true, data: payments || [], total: totalEarned }, { status: 200 });
  } catch (err: any) {
    console.error('[API VENDOR PAYMENTS] Error:', err);
    return NextResponse.json({ success: true, data: [], total: 0 }, { status: 200 });
  }
}
