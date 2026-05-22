import { supabaseAdmin } from '@/lib/supabase-admin';

export const laundryService = {
  async list(filters: { isActive?: boolean } = {}) {
    let query = supabaseAdmin.from('laundry_services').select('*');
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    const { data, error } = await query.order('rank', { ascending: true });
    return { success: !error, data: data || [], error: error?.message };
  },

  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('laundry_services')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { success: !error && !!data, data, error: error?.message || (data ? null : 'Service not found') };
  },

  async createOrder(input: any) {
    const { data, error } = await supabaseAdmin
      .from('laundry_orders')
      .insert({
        user_id: input.userId,
        laundry_service_id: input.laundryServiceId,
        items: input.items,
        delivery_address: input.deliveryAddress,
        pickup_type: input.pickupType,
        pickup_date: input.pickupDate,
        total_amount: input.totalAmount,
        notes: input.notes,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();
    
    if (data) {
      return { 
        success: true, 
        data: { 
          ...data, 
          _id: data.id, 
          userId: data.user_id, 
          laundryServiceId: data.laundry_service_id, 
          totalAmount: data.total_amount 
        } 
      };
    }
    return { success: false, error: error?.message };
  },

  async getUserOrders(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('laundry_orders')
      .select('*, laundry_service:laundry_services(id, name, images)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) {
      const mapped = data.map(o => ({
        ...o,
        _id: o.id,
        totalAmount: o.total_amount,
        pickupType: o.pickup_type,
        pickupDate: o.pickup_date,
        laundryService: o.laundry_service
      }));
      return { success: true, data: mapped };
    }
    return { success: !error, data: [], error: error?.message };
  },

  async getVendorService(vendorId: string) {
    const { data, error } = await supabaseAdmin
      .from('laundry_services')
      .select('*')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    return { success: !error, data, error: error?.message };
  },

  async updateVendorService(vendorId: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('laundry_services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('vendor_id', vendorId)
      .select()
      .single();
    return { success: !error, data, error: error?.message };
  },

  async getVendorOrders(vendorId: string) {
    const { data: service } = await this.getVendorService(vendorId);
    if (!service) return { success: true, data: [] };

    const { data, error } = await supabaseAdmin
      .from('laundry_orders')
      .select('*, user:profiles(id, name, email, phone)')
      .eq('laundry_service_id', service.id)
      .order('created_at', { ascending: false });
    return { success: !error, data: data || [], error: error?.message };
  },

  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabaseAdmin
      .from('laundry_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    return { success: !error, data, error: error?.message };
  }
};
