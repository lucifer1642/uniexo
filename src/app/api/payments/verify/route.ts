import { NextResponse } from 'next/server';
import { paymentService } from '@/modules/checkout/payment.service';
import { notificationService } from '@/modules/email/notification.service';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await paymentService.verifyPayment(body);

    if (result.success) {
      // Find booking + user to send notifications
      try {
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .select('booking_id, user_id, amount')
          .eq('razorpay_order_id', body.razorpay_order_id)
          .maybeSingle();

        if (payment) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('id', payment.user_id)
            .maybeSingle();

          if (profile) {
            notificationService.onPaymentReceived(
              payment.user_id,
              profile.email,
              profile.name,
              payment.amount,
              body.razorpay_payment_id
            ).catch(() => {});
          }

          // Also find booking to notify vendor
          if (payment.booking_id) {
            const { data: booking } = await supabaseAdmin
              .from('bookings')
              .select('vendor_id, total_amount')
              .eq('id', payment.booking_id)
              .maybeSingle();

            if (booking) {
              const { data: vendor } = await supabaseAdmin
                .from('profiles')
                .select('name, email')
                .eq('id', booking.vendor_id)
                .maybeSingle();

              if (vendor) {
                notificationService.onBookingCreated(
                  booking.vendor_id,
                  vendor.email,
                  vendor.name,
                  'Vehicle Rental',
                  booking.total_amount
                ).catch(() => {});
              }
            }
          }
        }
      } catch {
        // Notifications are non-critical
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API PAYMENT VERIFY] Error:', err);
    return NextResponse.json({ success: false, error: 'Payment verification failed.' }, { status: 200 });
  }
}
