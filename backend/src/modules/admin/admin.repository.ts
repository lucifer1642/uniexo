import { supabase } from '../../config/supabase';
import { PaymentStatus, VendorApprovalStatus } from '../../types/enums';

export class AdminRepository {
  async listUsers(page: number, limit: number, role?: string, search?: string) {
    const skip = (page - 1) * limit;

    let q = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (role && role !== 'all') {
      q = q.eq('role', role);
    }
    if (search?.trim()) {
      const s = `%${search.trim()}%`;
      q = q.ilike('name', s);
    }

    const { data, error, count } = await q.range(skip, skip + limit - 1);

    if (error) throw error;

    const rows =
      data?.map((u: Record<string, unknown>) => ({
        ...u,
        _id: u.id,
      })) ?? [];

    return {
      data: rows,
      pagination: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
        hasNext: page < Math.ceil((count ?? 0) / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getDashboardStats() {
    const [{ count: totalUsers }, { count: totalVendors }, { count: pendingVendors }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('vendor_profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('vendor_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', VendorApprovalStatus.PENDING),
    ]);

    const [
      { count: totalVehicles },
      { count: totalHouses },
      { count: totalBookings },
      { count: totalOrders },
      { count: totalPayments },
      { count: totalMarketplaceItems },
    ] = await Promise.all([
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('houses').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true }),
      supabase.from('marketplace_items').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    ]);

    const { data: paymentsRows } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', PaymentStatus.CAPTURED);

    const totalRevenue = (paymentsRows || []).reduce(
      (s: number, p: any) => s + Number(p.amount ?? 0),
      0,
    );

    const { data: bookingStatusRows } = await supabase.from('bookings').select('status');
    const bookingStats: Record<string, number> = {};
    for (const b of bookingStatusRows || []) {
      const k = (b as { status: string }).status;
      bookingStats[k] = (bookingStats[k] || 0) + 1;
    }

    const { data: recentBookingsNorm } = await supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email), vendor:vendor_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*, profiles:user_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      counts: {
        totalUsers: totalUsers ?? 0,
        totalVendors: totalVendors ?? 0,
        pendingVendors: pendingVendors ?? 0,
        totalVehicles: totalVehicles ?? 0,
        totalHouses: totalHouses ?? 0,
        totalBookings: totalBookings ?? 0,
        totalOrders: totalOrders ?? 0,
        totalPayments: totalPayments ?? 0,
        totalMarketplaceItems: totalMarketplaceItems ?? 0,
      },
      totalRevenue,
      bookingStats,
      recentBookings: recentBookingsNorm,
      recentPayments: recentPayments ?? [],
    };
  }

  async suspendUser(userId: string, suspended: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_suspended: suspended })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data ? { ...data, _id: data.id } : null;
  }

  async getReportedItems(page: number, limit: number) {
    const skip = (page - 1) * limit;
    let q = supabase
      .from('marketplace_items')
      .select('*, profiles:seller_id(name, email)', { count: 'exact' })
      .eq('is_reported', true)
      .eq('is_deleted', false)
      .order('report_count', { ascending: false });

    const { data, error, count } = await q.range(skip, skip + limit - 1);
    if (error) throw error;

    const rows =
      data?.map((item: Record<string, unknown>) => ({
        ...item,
        _id: item.id,
      })) ?? [];

    return {
      data: rows,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getSettings() {
    const { data, error } = await supabase.from('admin_settings').select('*').order('key');
    if (error) throw error;
    return data ?? [];
  }

  async upsertSetting(key: string, value: unknown, description?: string) {
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({
        key,
        value,
        description: description ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTransactions(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*, profiles:user_id(name, email)', { count: 'exact' })
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows =
      data?.map((t: Record<string, unknown>) => ({
        ...t,
        _id: t.id,
      })) ?? [];

    return {
      data: rows,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    };
  }

  async removeReportedItem(itemId: string) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .update({ is_deleted: true })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data ? { ...data, _id: data.id } : null;
  }

  async getVendorsByCategory(category: 'ROOM' | 'CAR' | 'LAUNDRY') {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*, profiles:user_id(name, email, phone)')
      .eq('service_type', category)
      .order('rank', { ascending: false })
      .order('business_name', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((v: Record<string, unknown>) => ({
      ...v,
      _id: v.id,
      businessName: v.business_name,
      businessPhone: v.business_phone,
      businessAddress: v.business_address,
      approvalStatus: v.approval_status,
      userId:
        typeof v.user_id === 'string'
          ? { _id: v.user_id, name: (v.profiles as any)?.name }
          : v.user_id,
    }));
  }

  async updateVendorRank(vendorProfileId: string, rank: number) {
    const { data: profile, error: fErr } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('id', vendorProfileId)
      .single();

    if (fErr || !profile) return null;

    const userId = profile.user_id as string;
    const serviceType = profile.service_type as string;

    const { error: uErr } = await supabase
      .from('vendor_profiles')
      .update({ rank })
      .eq('id', vendorProfileId);

    if (uErr) throw uErr;

    if (serviceType === 'ROOM') {
      await supabase.from('houses').update({ rank }).eq('vendor_id', userId);
    } else if (serviceType === 'CAR') {
      await supabase.from('vehicles').update({ rank }).eq('vendor_id', userId);
    } else if (serviceType === 'LAUNDRY') {
      await supabase.from('laundry_services').update({ rank }).eq('vendor_id', userId);
    }

    const { data: full } = await supabase
      .from('vendor_profiles')
      .select('*, profiles:user_id(name, email, phone)')
      .eq('id', vendorProfileId)
      .single();

    return full
      ? {
          ...full,
          _id: full.id,
          businessName: full.business_name,
          businessPhone: full.business_phone,
          businessAddress: full.business_address,
          approvalStatus: full.approval_status,
          userId: full.user_id,
        }
      : null;
  }
}
