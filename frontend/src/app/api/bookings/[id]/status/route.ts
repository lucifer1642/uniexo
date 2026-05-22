import { NextResponse } from 'next/server';
import { bookingService } from '@/modules/checkout/booking.service';
import { notificationService } from '@/modules/email/notification.service';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, userId, vendorId } = await req.json();

    if (!status) return NextResponse.json({ success: false, error: 'Status is required.' }, { status: 200 });

    const result = await bookingService.updateStatus(id, status);

    if (result.success) {
      // Notify relevant party
      if (status === 'confirmed' && userId) {
        notificationService.notify({
          userId,
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed by the vendor!',
          type: 'booking_confirmed',
        }).catch(() => {});
      }
      if (status === 'cancelled') {
        if (userId) {
          notificationService.notify({
            userId,
            title: 'Booking Cancelled',
            message: 'Your booking has been cancelled.',
            type: 'danger',
          }).catch(() => {});
        }
        if (vendorId) {
          notificationService.notify({
            userId: vendorId,
            title: 'Booking Cancelled',
            message: 'A booking has been cancelled by the user.',
            type: 'danger',
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API BOOKING STATUS] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update booking.' }, { status: 200 });
  }
}
