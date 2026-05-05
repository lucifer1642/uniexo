import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

function mapLaundryServiceRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    vendorId: row.vendor_id,
    providerName: row.provider_name,
    providerPhone: row.provider_phone,
    providerAddress: row.provider_address,
    onsitePickup: row.onsite_pickup,
    onStoreService: row.on_store_service,
    onsitePickupCharge: row.onsite_pickup_charge,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    laundryServiceId: row.laundry_service_id,
    totalAmount: row.total_amount,
    commissionAmount: row.commission_amount,
    paymentStatus: row.payment_status,
    pickupAddress: row.pickup_address,
    pickupPhone: row.pickup_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
        is_active: data.isActive !== undefined ? data.isActive : true,
        approval_status: data.approvalStatus || 'approved', // Default to approved for now as per legacy
      })
      .select()
      .single();

    if (error) throw error;
    return mapLaundryServiceRow(service as Record<string, unknown>);
  }

  async findServiceById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('laundry_services')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    
    if (error) return null;
    return mapLaundryServiceRow(data as Record<string, unknown>);
  }

  async updateService(id: string, data: any): Promise<any | null> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.providerName !== undefined) patch.provider_name = data.providerName;
    if (data.providerPhone !== undefined) patch.provider_phone = data.providerPhone;
    if (data.providerAddress !== undefined) patch.provider_address = data.providerAddress;
    if (data.services !== undefined) patch.services = data.services;
    if (data.images !== undefined) patch.images = data.images;
    if (data.rank !== undefined) patch.rank = data.rank;
    if (data.onsitePickup !== undefined) patch.onsite_pickup = data.onsitePickup;
    if (data.onStoreService !== undefined) patch.on_store_service = data.onStoreService;
    if (data.onsitePickupCharge !== undefined) patch.onsite_pickup_charge = data.onsitePickupCharge;
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    if (data.approvalStatus !== undefined) patch.approval_status = data.approvalStatus;

    const { data: service, error } = await supabase
      .from('laundry_services')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapLaundryServiceRow(service as Record<string, unknown>);
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
      data: (data || []).map(r => mapLaundryServiceRow(r as Record<string, unknown>)),
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
    return mapOrderRow(order as Record<string, unknown>);
  }

  async findOrderById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles:user_id(name, email, phone), laundry_services(name, provider_name)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return mapOrderRow(data as Record<string, unknown>);
  }

  async updateOrderStatus(id: string, status: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapOrderRow(data as Record<string, unknown>);
  }

  async patchOrder(id: string, patch: Record<string, unknown>): Promise<any | null> {
    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapOrderRow(data as Record<string, unknown>);
  }

  async findServicesByVendorUserId(vendorUserId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('laundry_services')
      .select('*')
      .eq('vendor_id', vendorUserId)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();

    if (error) return null;
    if (!data) return null;
    return mapLaundryServiceRow(data as Record<string, unknown>);
  }

  async findOrdersForService(serviceId: string, filter?: { status?: string }) {
    let q = supabase.from('orders').select('*').eq('laundry_service_id', serviceId);
    if (filter?.status) q = q.eq('status', filter.status);
    const { data, error } = await q;
    if (error) return [];
    return (data || []).map(r => mapOrderRow(r as Record<string, unknown>));
  }

  async findOrdersPaged(
    laundryServiceId: string,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ rows: any[]; total: number }> {
    const skip = (page - 1) * limit;
    let base = supabase
      .from('orders')
      .select('*, profiles:user_id(name, email, phone)', { count: 'exact' })
      .eq('laundry_service_id', laundryServiceId)
      .order('created_at', { ascending: false });

    if (status) base = base.eq('status', status);

    const { data, error, count } = await base.range(skip, skip + limit - 1);
    if (error) return { rows: [], total: 0 };
    return { 
      rows: (data || []).map(r => mapOrderRow(r as Record<string, unknown>)), 
      total: count || 0 
    };
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
      data: (data || []).map(r => mapOrderRow(r as Record<string, unknown>)),
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
      data: (data || []).map(r => mapOrderRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }
}
