import { NextResponse } from 'next/server';
import { bookingService } from '@/modules/checkout/booking.service';
import { notificationService } from '@/modules/email/notification.service';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req: Request, user: any) => {
  try {
    const result = await bookingService.getUserBookings(user.userId);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
});

export const POST = withAuth(async (req: Request, user: any) => {
  try {
    const body = await req.json();
    const { 
      serviceType, serviceId, startDate, endDate, bookingType, notes, paymentMethod,
      securityDeposit, monthlyRent, totalMonths 
    } = body;
    
    const userId = user.userId;

    if (!userId || !serviceId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing required booking fields.' }, { status: 200 });
    }

    const result = await bookingService.create({
      userId, serviceType, serviceId, startDate, endDate, bookingType, notes, paymentMethod,
      securityDeposit, monthlyRent, totalMonths
    });

    if (result.success && result.data) {
      // Notify user
      notificationService.notify({
        userId,
        title: 'Booking Created',
        message: `Your booking has been created. Complete payment to confirm.`,
        type: 'info',
      }).catch(() => {});

      // Notify vendor
      notificationService.notify({
        userId: result.data.vendor_id,
        title: 'New Booking Received',
        message: `A new booking worth ₹${result.data.total_amount} has been received.`,
        type: 'booking_confirmed',
      }).catch(() => {});
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API BOOKINGS POST] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create booking.' }, { status: 200 });
  }
});
