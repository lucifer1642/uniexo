import { supabaseAdmin } from '@/lib/supabase-admin';

export const fleetService = {
  async getFleet(vendorId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select(`
          id, _id:id, name, registration_number, current_status, expected_return_at,
          current_booking:bookings!current_booking_id(id, _id:id, end_date, user:profiles!user_id(name))
        `)
        .eq('vendor_id', vendorId)
        .eq('is_deleted', false);

      if (error) {
        console.error('[FLEET SERVICE] getFleet error:', error);
        return { success: false, error: 'Failed to fetch fleet.' };
      }

      // Map to frontend expectations
      const mapped = data?.map(v => {
        let minutesUntilReturn = 0;
        let isOverdue = false;
        
        if (v.expected_return_at) {
          const expected = new Date(v.expected_return_at).getTime();
          const now = Date.now();
          const diffMs = expected - now;
          minutesUntilReturn = Math.round(Math.abs(diffMs) / 60000);
          isOverdue = diffMs < 0;
        }

        const currentBooking: any = Array.isArray(v.current_booking) ? v.current_booking[0] : v.current_booking;

        return {
          _id: v.id,
          name: v.name,
          registrationNumber: v.registration_number,
          currentStatus: v.current_status || 'available',
          expectedReturnAt: v.expected_return_at,
          minutesUntilReturn,
          isOverdue,
          currentBooking: currentBooking ? {
            _id: currentBooking.id,
            endDate: currentBooking.end_date,
            userId: { name: (Array.isArray(currentBooking.user) ? currentBooking.user[0]?.name : currentBooking.user?.name) || 'Customer' }
          } : null
        };
      });

      return { success: true, data: mapped || [] };
    } catch (err: any) {
      console.error('[FLEET SERVICE] getFleet error:', err);
      return { success: false, error: 'Failed to fetch fleet.' };
    }
  },

  async dispatchVehicle(vehicleId: string, vendorId: string, payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { dispatchedAt, expectedReturnAt, odometerOut, dispatchNotes, currentBookingId } = payload;

      // Update vehicle status
      const { error: updateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          is_available: false,
          current_status: 'dispatched',
          current_booking_id: currentBookingId || null,
          expected_return_at: expectedReturnAt || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .eq('vendor_id', vendorId);

      if (updateError) return { success: false, error: 'Failed to update vehicle status.' };

      // Log operation
      await supabaseAdmin.from('vehicle_operations').insert({
        vehicle_id: vehicleId,
        vendor_id: vendorId,
        booking_id: currentBookingId || null,
        operation_type: 'dispatch',
        odometer: odometerOut || null,
        notes: dispatchNotes || null,
        created_at: dispatchedAt || new Date().toISOString()
      });

      return { success: true };
    } catch (err: any) {
      console.error('[FLEET SERVICE] dispatch error:', err);
      return { success: false, error: 'Failed to dispatch vehicle.' };
    }
  },

  async returnVehicle(vehicleId: string, vendorId: string, payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { returnedAt, odometerIn, returnNotes } = payload;

      // Get current booking to log it in return
      const { data: vehicle } = await supabaseAdmin
        .from('vehicles')
        .select('current_booking_id')
        .eq('id', vehicleId)
        .maybeSingle();

      const bookingId = vehicle?.current_booking_id || null;

      // Update vehicle status
      const { error: updateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          is_available: true,
          current_status: 'available',
          current_booking_id: null,
          expected_return_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .eq('vendor_id', vendorId);

      if (updateError) return { success: false, error: 'Failed to update vehicle status.' };

      // Log operation
      await supabaseAdmin.from('vehicle_operations').insert({
        vehicle_id: vehicleId,
        vendor_id: vendorId,
        booking_id: bookingId,
        operation_type: 'return',
        odometer: odometerIn || null,
        notes: returnNotes || null,
        created_at: returnedAt || new Date().toISOString()
      });

      return { success: true };
    } catch (err: any) {
      console.error('[FLEET SERVICE] return error:', err);
      return { success: false, error: 'Failed to return vehicle.' };
    }
  },

  async toggleMaintenance(vehicleId: string, vendorId: string, isEntering: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const status = isEntering ? 'maintenance' : 'available';
      const isAvailable = !isEntering;

      const { error: updateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          is_available: isAvailable,
          current_status: status,
          current_booking_id: null,
          expected_return_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .eq('vendor_id', vendorId);

      if (updateError) return { success: false, error: 'Failed to update vehicle status.' };

      // Log operation
      await supabaseAdmin.from('vehicle_operations').insert({
        vehicle_id: vehicleId,
        vendor_id: vendorId,
        operation_type: isEntering ? 'maintenance_start' : 'maintenance_end',
        created_at: new Date().toISOString()
      });

      return { success: true };
    } catch (err: any) {
      console.error('[FLEET SERVICE] maintenance error:', err);
      return { success: false, error: 'Failed to update maintenance status.' };
    }
  }
};
