import { supabaseAdmin } from '@/lib/supabase-admin';

export const intelligenceService = {
  /**
   * Tracks a heartbeat from a user session
   */
  async trackHeartbeat(input: {
    userId?: string;
    campus?: string;
    currentPage: string;
    sessionId: string;
    lat?: number;
    lng?: number;
  }) {
    const { error } = await supabaseAdmin
      .from('user_telemetry')
      .upsert({
        user_id: input.userId,
        campus: input.campus,
        current_page: input.currentPage,
        session_id: input.sessionId,
        location_lat: input.lat,
        location_lng: input.lng,
        last_heartbeat: new Date().toISOString()
      }, { onConflict: 'session_id' });
    
    return { success: !error, error: error?.message };
  },

  /**
   * Gets real-time pulse of active sessions per campus
   */
  async getLivePulse() {
    const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 mins
    const { data, error } = await supabaseAdmin
      .from('user_telemetry')
      .select('campus, count')
      .gt('last_heartbeat', threshold)
      .not('campus', 'is', null);
    
    // Manual aggregation because Supabase/PostgREST count is tricky in one line
    const { data: raw } = await supabaseAdmin
      .from('user_telemetry')
      .select('campus')
      .gt('last_heartbeat', threshold);
    
    const pulse: Record<string, number> = {};
    raw?.forEach(r => {
      if (r.campus) pulse[r.campus] = (pulse[r.campus] || 0) + 1;
    });

    return { success: !error, data: pulse, error: error?.message };
  },

  /**
   * Computes LTV and Churn risk for a user (Predictive AI Stub)
   */
  async computeUserMetrics(userId: string) {
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('total_amount')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    const ltv = bookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
    
    // Simple Churn probability: (Days since last booking / 30) capped at 1.0
    const { data: lastBooking } = await supabaseAdmin
      .from('bookings')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let churnRisk = 0.1;
    if (lastBooking) {
      const days = (Date.now() - new Date(lastBooking.created_at).getTime()) / (1000 * 60 * 60 * 24);
      churnRisk = Math.min(0.9, days / 60);
    }

    const metrics = {
      ltv_score: ltv,
      churn_risk_score: churnRisk,
      engagement_score: bookings?.length || 0
    };

    await supabaseAdmin
      .from('intelligence_metrics')
      .upsert({
        entity_id: userId,
        type: 'user',
        ...metrics,
        updated_at: new Date().toISOString()
      }, { onConflict: 'entity_id, type' });

    return { success: true, data: metrics };
  },

  /**
   * Computes surge pricing suggestions for a vendor
   */
  async getSurgeSuggestions(vendorId: string) {
    // Check occupancy
    const { count: total } = await supabaseAdmin.from('vehicles').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId);
    const { count: available } = await supabaseAdmin.from('vehicles').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('is_available', true);
    
    const occupancy = total && total > 0 ? (total - (available || 0)) / total : 0;
    
    let suggestion = 1.0; // 1x
    if (occupancy > 0.8) suggestion = 1.25;
    if (occupancy > 0.95) suggestion = 1.5;

    return {
      success: true,
      data: {
        multiplier: suggestion,
        reason: occupancy > 0.8 ? 'High demand in your area' : 'Normal demand',
        occupancyRate: occupancy
      }
    };
  },

  /**
   * Gets the latest platform KPIs
   */
  async getPlatformOverview() {
    const { data, error } = await supabaseAdmin
      .from('platform_kpis')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(2);
    
    const latest = data?.[0] || {};
    const previous = data?.[1] || {};
    
    // Calculate trends
    const calculateTrend = (cur: number, prev: number) => {
      if (!prev) return '+0%';
      const diff = ((cur - prev) / prev) * 100;
      return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    };

    return {
      success: !error,
      data: {
        gtv: latest.gtv || 0,
        gtvTrend: calculateTrend(latest.gtv, previous.gtv),
        latency: latest.avg_latency_ms || 0,
        conversion: latest.conversion_funnel || {},
        northStar: latest.north_star_score || 0,
        burnRate: latest.burn_rate || 0
      },
      error: error?.message
    };
  },

  /**
   * Manually triggers a snapshot of all metrics
   */
  async computeDailySnapshots() {
    // 1. GTV (Total successful payments today)
    const today = new Date().toISOString().split('T')[0];
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'captured')
      .gte('created_at', today);
    
    const gtv = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 2. Conversion (Very simplified stub for now)
    const funnel = { search: 100, view: 80, book: 40, pay: 20 };

    // 3. North Star (Growth * Retention / Burn)
    const northStar = gtv / 1000; // Simplified

    const { error } = await supabaseAdmin
      .from('platform_kpis')
      .upsert({
        snapshot_date: today,
        gtv,
        conversion_funnel: funnel,
        avg_latency_ms: 42,
        north_star_score: northStar,
        created_at: new Date().toISOString()
      }, { onConflict: 'snapshot_date' });
    
    return { success: !error, error: error?.message };
  }
};
