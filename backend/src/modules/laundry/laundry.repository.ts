import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

export class LaundryRepository {
  async createService(data: any): Promise<any> {
    const { data: service, error } = await supabase
      .from('laundry_services')
      .insert({
        vendor_id: data.vendorId,
        name: data.name,
        description: data.description,
        provider_name: data.providerName,
        provider_phone: data.providerPhone,
        provider_address: data.providerAddress,
        services: data.services,
        images: data.images,
        rank: data.rank,
        onsite_pickup: data.onsitePickup,
        on_store_service: data.onStoreService,
        onsite_pickup_charge: data.onsitePickupCharge,
      })
      .select()
      .single();

    if (error) throw error;
    return service;
  }

  async findServiceById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('laundry_services')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateService(id: string, data: any): Promise<any | null> {
    const { data: service, error } = await supabase
      .from('laundry_services')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await supabase
      .from('laundry_services')
      .update({ is_deleted: true })
      .eq('id', id);
  }

  async findAllServices(filter: Record<string, any>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('laundry_services')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false);

    if (filter.isActive !== undefined) baseQuery = baseQuery.eq('is_active', filter.isActive);

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('rank', { ascending: false })
      .order('name', { ascending: true });

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

  async createOrder(data: any): Promise<any> {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: data.userId,
        laundry_service_id: data.laundryServiceId,
        items: data.items,
        total_amount: data.totalAmount,
        commission_amount: data.commissionAmount,
        status: data.status || 'pending',
        payment_status: data.paymentStatus || 'pending',
        pickup_address: data.pickupAddress,
        pickup_phone: data.pickupPhone,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return order;
  }

  async findOrderById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles:user_id(name, email, phone), laundry_services(name, provider_name)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateOrderStatus(id: string, status: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async findOrdersByUser(userId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('orders')
      .select('*, laundry_services(name, provider_name)', { count: 'exact' })
      .eq('user_id', userId)
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

  async findAllOrders(filter: Record<string, any>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('orders')
      .select('*, profiles:user_id(name, email), laundry_services(name, provider_name)', { count: 'exact' });

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
}
