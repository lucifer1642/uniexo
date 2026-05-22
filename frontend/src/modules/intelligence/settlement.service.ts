import { supabaseAdmin } from '@/lib/supabase-admin';

export const settlementService = {
  /**
   * Calculates net payout and carbon footprint for a vendor period
   */
  async computeSettlement(vendorId: string, startDate: string, endDate: string) {
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*, vehicle:vehicles(type)')
      .eq('vendor_id', vendorId)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (!bookings) return { success: false, error: 'No bookings found' };

    const totalGtv = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    const commissionRate = 0.10; // 10%
    const commission = totalGtv * commissionRate;
    const netPayout = totalGtv - commission;

    // Carbon Footprint Calculation
    // Car = 0.2kg per km, Bike = 0.05kg per km. 
    // Since we don't have km, we estimate based on hours/days.
    // 1 day Car = ~50km = 10kg. 1 day Bike = ~30km = 1.5kg.
    let carbonKg = 0;
    bookings.forEach(b => {
      const isCar = b.vehicle?.type === 'car' || b.service_type === 'vehicle';
      const days = Math.max(1, (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24));
      carbonKg += isCar ? days * 10 : days * 1.5;
    });

    const settlement = {
      vendor_id: vendorId,
      period_start: startDate,
      period_end: endDate,
      total_gtv: totalGtv,
      commission_amount: commission,
      net_payout: netPayout,
      carbon_footprint_kg: carbonKg,
      status: 'pending'
    };

    const { data, error } = await supabaseAdmin
      .from('settlements')
      .insert(settlement)
      .select()
      .single();

    return { success: !error, data, error: error?.message };
  }
};
