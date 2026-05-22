import { NextResponse } from 'next/server';
import { bookingService } from '@/modules/checkout/booking.service';
import { notificationService } from '@/modules/email/notification.service';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req: Request, user: any) => {
  try {
    const result = await bookingService.getVendorBookings(user.userId);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}, 'vendor');

export const PATCH = withAuth(async (req: Request, user: any) => {
  try {
    const { bookingId, status } = await req.json();
    
    // Vendor is updating booking status. Ensure booking belongs to this vendor (security check!)
    const { data: bookingCheck } = await supabaseAdmin
      .from('bookings')
      .select('vendor_id')
      .eq('id', bookingId)
      .single();

    if (!bookingCheck || (bookingCheck.vendor_id !== user.userId && user.role !== 'admin')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select('*, profiles:user_id(email, name)')
      .single();
    
    if (!error && data) {
      notificationService.notify({
        userId: data.user_id,
        email: (data.profiles as any).email,
        title: `Booking ${status.toUpperCase()}`,
        message: `Your booking for ${data.service_type} has been ${status}.`,
        type: status === 'confirmed' ? 'success' : 'warning'
      }).catch(() => {});
    }

    return NextResponse.json({ success: !error, data, error: error?.message });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}, 'vendor');
