import { supabase } from '../../config/supabase';

export class AnalyticsService {
  /**
   * KPI Snapshot: The "Pulse" of the platform
   */
  async getKpiSnapshot() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalUsers },
      { count: totalVendors },
      { data: allCapturedPayments },
      { count: totalBookings },
      { count: activeBookings }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor'),
      supabase.from('payments').select('amount, created_at').eq('status', 'captured'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed')
    ]);

    const totalRevenue = allCapturedPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
    const todayRevenue = allCapturedPayments?.filter(p => new Date(p.created_at) >= today)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    return {
      counts: {
        users: totalUsers || 0,
        vendors: totalVendors || 0,
        bookings: totalBookings || 0,
        activeBookings: activeBookings || 0
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue
      }
    };
  }

  /**
   * Revenue over time (Daily for last 30 days)
   */
  async getRevenueTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'captured')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!payments) return [];

    const trendsMap: Record<string, { amount: number, count: number }> = {};
    
    payments.forEach(p => {
      const date = new Date(p.created_at).toISOString().split('T')[0];
      if (!trendsMap[date]) trendsMap[date] = { amount: 0, count: 0 };
      trendsMap[date].amount += Number(p.amount) || 0;
      trendsMap[date].count += 1;
    });

    return Object.entries(trendsMap).map(([_id, data]) => ({
      _id,
      ...data
    })).sort((a, b) => a._id.localeCompare(b._id));
  }

  /**
   * Conversion Funnel: Search -> View -> Book -> Pay
   */
  async getConversionMetrics() {
    const [
      { count: totalBookings },
      { count: capturedPayments }
    ] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'captured')
    ]);

    const bookings = totalBookings || 0;
    const payments = capturedPayments || 0;

    return {
      bookingToPaymentRatio: bookings > 0 ? (payments / bookings) * 100 : 0,
      totalBookings: bookings,
      completedPayments: payments
    };
  }

  /**
   * Module Performance
   */
  async getModulePerformance() {
    const { data: confirmedBookings } = await supabase
      .from('bookings')
      .select('service_type, total_amount')
      .eq('status', 'confirmed');

    if (!confirmedBookings) return [];

    const moduleMap: Record<string, { revenue: number, bookings: number }> = {};

    confirmedBookings.forEach(b => {
      const type = b.service_type || 'other';
      if (!moduleMap[type]) moduleMap[type] = { revenue: 0, bookings: 0 };
      moduleMap[type].revenue += Number(b.total_amount) || 0;
      moduleMap[type].bookings += 1;
    });

    return Object.entries(moduleMap).map(([_id, data]) => ({
      _id,
      ...data
    })).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * KYC Velocity
   */
  async getKycVelocity() {
    const [
      { count: pending },
      { count: approved },
      { count: rejected }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'rejected')
    ]);

    return { 
      pending: pending || 0, 
      approved: approved || 0, 
      rejected: rejected || 0 
    };
  }
}
