import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

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
      })
      .select()
      .single();

    if (error) throw error;
    return booking;
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email, phone), vendor:vendor_id(name, email, phone)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return booking;
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
      data,
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
      data,
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
      data,
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
    return data;
  }
}
