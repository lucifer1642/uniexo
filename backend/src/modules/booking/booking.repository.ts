import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

function mapBookingRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    vendorId: row.vendor_id,
    serviceType: row.service_type,
    serviceId: row.service_id,
    bookingType: row.booking_type,
    paymentMethod: row.payment_method,
    startDate: row.start_date,
    endDate: row.end_date,
    totalAmount: row.total_amount,
    commissionAmount: row.commission_amount,
    commissionPercent: row.commission_percent,
    securityDeposit: row.security_deposit,
    monthlyRent: row.monthly_rent,
    totalMonths: row.total_months,
    serviceSnapshot: row.service_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BookingRepository {
  async create(data: any): Promise<any> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: data.userId,
        vendor_id: data.vendorId,
        service_type: data.serviceType,
        service_id: data.serviceId,
        booking_type: data.bookingType,
        payment_method: data.paymentMethod || 'online',
        start_date: data.startDate,
        end_date: data.endDate,
        total_amount: data.totalAmount,
        commission_amount: data.commissionAmount,
        commission_percent: data.commissionPercent,
        status: data.status || 'pending',
        notes: data.notes,
        security_deposit: data.securityDeposit,
        monthly_rent: data.monthlyRent,
        total_months: data.totalMonths,
        installments: data.installments,
        service_snapshot: data.serviceSnapshot,
      })
      .select()
      .single();

    if (error) throw error;
    return mapBookingRow(booking as Record<string, unknown>);
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email, phone), vendor:vendor_id(name, email, phone)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return mapBookingRow(data as Record<string, unknown>);
  }

  async update(id: string, data: any): Promise<any | null> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapBookingRow(booking as Record<string, unknown>);
  }

  async findByUser(userId: string, query: PaginationQuery, filter: Record<string, any> = {}) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('bookings')
      .select('*, vendor:vendor_id(name, email)', { count: 'exact' })
      .eq('user_id', userId);

    if (filter.status) baseQuery = baseQuery.eq('status', filter.status);

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapBookingRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findByVendor(vendorId: string, query: PaginationQuery, filter: Record<string, any> = {}) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email, phone)', { count: 'exact' })
      .eq('vendor_id', vendorId);

    if (filter.status) baseQuery = baseQuery.eq('status', filter.status);

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapBookingRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email), vendor:vendor_id(name, email)', { count: 'exact' });

    if (filter.status) baseQuery = baseQuery.eq('status', filter.status);

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapBookingRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findConflicting(
    serviceId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string,
  ): Promise<any[]> {
    let baseQuery = supabase
      .from('bookings')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'confirmed')
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    if (excludeBookingId) {
      baseQuery = baseQuery.neq('id', excludeBookingId);
    }

    const { data, error } = await baseQuery;
    if (error) return [];
    return (data || []).map(r => mapBookingRow(r as Record<string, unknown>));
  }

  /** When a booking is confirmed, auto-cancel other pending bookings on the same listing that overlap dates. */
  async cancelOverlappingPending(
    serviceId: string,
    startIso: string,
    endIso: string,
    excludeBookingId: string,
    cancellationReason: string,
  ): Promise<void> {
    const { data: pending, error } = await supabase
      .from('bookings')
      .select('id, start_date, end_date')
      .eq('service_id', serviceId)
      .eq('status', 'pending');

    if (error || !pending?.length) return;

    const windowStart = new Date(startIso).getTime();
    const windowEnd = new Date(endIso).getTime();

    const overlapIds = pending
      .filter((b: { id: string }) => b.id !== excludeBookingId)
      .filter((b: { start_date: string; end_date: string }) => {
        const s = new Date(b.start_date).getTime();
        const e = new Date(b.end_date).getTime();
        return s <= windowEnd && e >= windowStart;
      })
      .map((b: { id: string }) => b.id);

    if (overlapIds.length > 0) {
      await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancellation_reason: cancellationReason })
        .in('id', overlapIds);
    }
  }
}
