import { supabaseAdmin } from '@/lib/supabase-admin';

export const vendorService = {
  async getProfile(vendorId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', vendorId)
      .eq('role', 'vendor')
      .maybeSingle();
    return { success: !error, data, error: error?.message };
  },

  async getStats(vendorId: string) {
    // Basic stats count
    const { count: vehicleCount } = await supabaseAdmin
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false);

    const { count: houseCount } = await supabaseAdmin
      .from('houses')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false);

    const { count: pendingBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('status', 'pending');

    return {
      success: true,
      data: {
        totalVehicles: vehicleCount || 0,
        totalHouses: houseCount || 0,
        pendingBookings: pendingBookings || 0,
      }
    };
  }
};
