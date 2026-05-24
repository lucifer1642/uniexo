import { supabaseAdmin } from '@/lib/supabase-admin';
import type { BookingRow, CreateBookingInput } from './checkout.types';

export const bookingService = {
  async create(input: CreateBookingInput): Promise<{ success: boolean; data?: BookingRow; error?: string }> {
    try {
      let vendorId: string;
      let totalAmount: number;
      let securityDeposit = 0;
      let monthlyRent = 0;
      let totalMonths = 0;

      if (input.serviceType === 'house') {
        const { data: house } = await supabaseAdmin
          .from('houses')
          .select('vendor_id, property_type, price_per_month, price_per_day, security_deposit, is_available')
          .eq('id', input.serviceId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (!house) return { success: false, error: 'Property not found or unavailable.' };
        if (!house.is_available) return { success: false, error: 'This property is currently unavailable.' };
        if (house.vendor_id === input.userId) return { success: false, error: 'You cannot book your own property.' };

        vendorId = house.vendor_id;
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const diffMs = Math.abs(end.getTime() - start.getTime());
        const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        if (house.property_type === 'pg') {
          monthlyRent = house.price_per_month || 0;
          totalMonths = Math.max(1, Math.ceil(days / 30));
          securityDeposit = house.security_deposit || 0;
          // For PG, upfront total is 1st month rent + deposit
          totalAmount = monthlyRent + securityDeposit;
        } else {
          totalAmount = days * (house.price_per_day || 0);
          monthlyRent = 0;
          totalMonths = 0;
          securityDeposit = 0;
        }
      } else {
        // Default to vehicle
        const { data: vehicle } = await supabaseAdmin
          .from('vehicles')
          .select('vendor_id, price_per_day, price_per_hour, is_available')
          .eq('id', input.serviceId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (!vehicle) return { success: false, error: 'Vehicle not found or unavailable.' };
        if (!vehicle.is_available) return { success: false, error: 'This vehicle is currently unavailable.' };
        if (vehicle.vendor_id === input.userId) return { success: false, error: 'You cannot book your own vehicle.' };

        vendorId = vehicle.vendor_id;
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const diffMs = Math.abs(end.getTime() - start.getTime());

        if (input.bookingType === 'hourly') {
          const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
          const hourlyRate = vehicle.price_per_hour || Math.round(vehicle.price_per_day / 24);
          totalAmount = hours * hourlyRate;
        } else {
          const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          totalAmount = days * vehicle.price_per_day;
        }
      }

      // Check for overlapping bookings
      const { data: overlapping } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('service_id', input.serviceId)
        .in('status', ['pending', 'confirmed'])
        .lt('start_date', input.endDate)
        .gt('end_date', input.startDate)
        .limit(1);

      if (overlapping && overlapping.length > 0) {
        return { success: false, error: 'Service is already booked for the selected dates.' };
      }

      const { data, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: input.userId,
          vendor_id: vendorId,
          service_type: input.serviceType || 'vehicle',
          service_id: input.serviceId,
          start_date: input.startDate,
          end_date: input.endDate,
          booking_type: input.bookingType || 'daily',
          total_amount: totalAmount,
          security_deposit: securityDeposit,
          monthly_rent: monthlyRent,
          total_months: totalMonths,
          notes: input.notes || null,
          payment_method: input.paymentMethod || 'online',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[BOOKING SERVICE] create error:', error);
        return { success: false, error: 'Failed to create booking.' };
      }

      return { success: true, data: data as BookingRow };
    } catch (err: any) {
      console.error('[BOOKING SERVICE] create error:', err);
      return { success: false, error: 'Failed to create booking.' };
    }
  },

  async getUserBookings(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data: bookings, error } = await supabaseAdmin
        .from('bookings')
        .select('*, user:profiles!user_id(id, name, email, phone)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[BOOKING SERVICE] getUserBookings error:', error);
        return { success: true, data: [] };
      }
      if (!bookings || bookings.length === 0) {
        return { success: true, data: [] };
      }

      // Enriched service details programmatically
      const vehicleIds = bookings.filter(b => b.service_type === 'vehicle').map(b => b.service_id);
      const houseIds = bookings.filter(b => b.service_type === 'house' || b.service_type === 'room' || b.service_type === 'pg').map(b => b.service_id);

      let vehicles: any[] = [];
      let houses: any[] = [];

      if (vehicleIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('vehicles')
          .select('id, name, type, brand, model, images, location')
          .in('id', vehicleIds);
        vehicles = data || [];
      }

      if (houseIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('houses')
          .select('id, title, property_type, address, city, images')
          .in('id', houseIds);
        houses = data || [];
      }

      const mappedData = bookings.map(b => {
        let serviceObj = null;
        if (b.service_type === 'vehicle') {
          const v = vehicles.find(x => x.id === b.service_id);
          if (v) serviceObj = { id: v.id, name: v.name, type: v.type, brand: v.brand, model: v.model, images: v.images, location: v.location };
        } else {
          const h = houses.find(x => x.id === b.service_id);
          if (h) serviceObj = { id: h.id, name: h.title, title: h.title, propertyType: h.property_type, address: h.address, city: h.city, images: h.images };
        }

        return {
          ...b,
          serviceId: serviceObj,
          vehicle: b.service_type === 'vehicle' ? serviceObj : null,
          house: b.service_type !== 'vehicle' ? serviceObj : null
        };
      });

      return { success: true, data: mappedData };
    } catch (err: any) {
      console.error('[BOOKING SERVICE] getUserBookings error:', err);
      return { success: true, data: [] };
    }
  },

  async getVendorBookings(vendorId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data: bookings, error } = await supabaseAdmin
        .from('bookings')
        .select('*, user:profiles!user_id(id, name, email, phone)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[BOOKING SERVICE] getVendorBookings error:', error);
        return { success: true, data: [] };
      }
      if (!bookings || bookings.length === 0) {
        return { success: true, data: [] };
      }

      // Enriched service details programmatically
      const vehicleIds = bookings.filter(b => b.service_type === 'vehicle').map(b => b.service_id);
      const houseIds = bookings.filter(b => b.service_type === 'house' || b.service_type === 'room' || b.service_type === 'pg').map(b => b.service_id);

      let vehicles: any[] = [];
      let houses: any[] = [];

      if (vehicleIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('vehicles')
          .select('id, name, type, brand, model, images, location')
          .in('id', vehicleIds);
        vehicles = data || [];
      }

      if (houseIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('houses')
          .select('id, title, property_type, address, city, images')
          .in('id', houseIds);
        houses = data || [];
      }

      const mappedData = bookings.map(b => {
        let serviceObj = null;
        if (b.service_type === 'vehicle') {
          const v = vehicles.find(x => x.id === b.service_id);
          if (v) serviceObj = { id: v.id, name: v.name, type: v.type, brand: v.brand, model: v.model, images: v.images, location: v.location };
        } else {
          const h = houses.find(x => x.id === b.service_id);
          if (h) serviceObj = { id: h.id, name: h.title, title: h.title, propertyType: h.property_type, address: h.address, city: h.city, images: h.images };
        }

        return {
          ...b,
          serviceId: serviceObj,
          vehicle: b.service_type === 'vehicle' ? serviceObj : null,
          house: b.service_type !== 'vehicle' ? serviceObj : null
        };
      });

      return { success: true, data: mappedData };
    } catch (err: any) {
      console.error('[BOOKING SERVICE] getVendorBookings error:', err);
      return { success: true, data: [] };
    }
  },

  async updateStatus(bookingId: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) {
        console.error('[BOOKING SERVICE] updateStatus error:', error);
        return { success: false, error: 'Failed to update booking.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Failed to update booking.' };
    }
  },
};
