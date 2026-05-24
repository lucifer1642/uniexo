import { NextResponse } from 'next/server';
import { bookingService } from '@/modules/checkout/booking.service';
import { notificationService } from '@/modules/email/notification.service';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req: Request, user: any) => {
  try {
    if (user.role === 'admin') {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      let query = require('@/lib/supabase-admin').supabaseAdmin
        .from('bookings')
        .select('*, user:profiles!user_id(*)', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (status && status !== 'all') query = query.eq('status', status);
      const { data: bookings, error } = await query;
      
      if (error || !bookings) {
        return NextResponse.json({ success: true, data: { data: [] } }, { status: 200 });
      }

      // Programmatic enrichment
      const vehicleIds = bookings.filter((b: any) => b.service_type === 'vehicle').map((b: any) => b.service_id);
      const houseIds = bookings.filter((b: any) => b.service_type === 'house' || b.service_type === 'room' || b.service_type === 'pg').map((b: any) => b.service_id);

      let vehicles: any[] = [];
      let houses: any[] = [];

      if (vehicleIds.length > 0) {
        const { data } = await require('@/lib/supabase-admin').supabaseAdmin.from('vehicles').select('*').in('id', vehicleIds);
        vehicles = data || [];
      }
      if (houseIds.length > 0) {
        const { data } = await require('@/lib/supabase-admin').supabaseAdmin.from('houses').select('*').in('id', houseIds);
        houses = data || [];
      }

      const mappedData = bookings.map((b: any) => {
        let serviceObj = null;
        if (b.service_type === 'vehicle') {
          serviceObj = vehicles.find(x => x.id === b.service_id) || null;
        } else {
          serviceObj = houses.find(x => x.id === b.service_id) || null;
        }
        return {
          ...b,
          serviceId: serviceObj,
          vehicle: b.service_type === 'vehicle' ? serviceObj : null,
          house: b.service_type !== 'vehicle' ? serviceObj : null
        };
      });

      return NextResponse.json({ success: true, data: { data: mappedData } }, { status: 200 });
    }
    const result = await bookingService.getUserBookings(user.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API BOOKINGS GET] Error:', err);
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
