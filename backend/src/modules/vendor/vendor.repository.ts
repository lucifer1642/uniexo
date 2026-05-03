import { supabase } from '../../config/supabase';
import { VendorApprovalStatus } from '../../types/enums';
import { PaginationQuery } from '../../types';

export class VendorRepository {
  async create(data: any): Promise<any> {
    const { data: profile, error } = await supabase
      .from('vendor_profiles')
      .insert({
        user_id: data.userId,
        business_name: data.businessName,
        business_address: data.businessAddress,
        business_phone: data.businessPhone,
        service_type: data.serviceType,
        description: data.description,
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  async findByUserId(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*, profiles(name, email, phone)')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data;
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*, profiles(name, email, phone)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateProfile(userId: string, data: any): Promise<any | null> {
    const { data: profile, error } = await supabase
      .from('vendor_profiles')
      .update({
        business_name: data.businessName,
        business_address: data.businessAddress,
        business_phone: data.businessPhone,
        description: data.description,
        service_type: data.serviceType,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return null;
    return profile;
  }

  async updateApproval(
    id: string,
    status: VendorApprovalStatus,
    rejectionReason?: string,
  ): Promise<any | null> {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .update({
        approval_status: status,
        rejection_reason: rejectionReason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    const skip = (query.page - 1) * query.limit;
    let baseQuery = supabase
      .from('vendor_profiles')
      .select('*, profiles(name, email, phone)', { count: 'exact' });

    if (filter.approvalStatus) {
      baseQuery = baseQuery.eq('approval_status', filter.approvalStatus);
    }

    const { data, error, count } = await baseQuery
      .range(skip, skip + query.limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data,
      pagination: {
        total: count || 0,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil((count || 0) / query.limit),
      },
    };
  }

  async getKPIs(vendorId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('vendor_kpis')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateDocuments(id: string, documents: string[]): Promise<any | null> {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .update({ documents })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }
}
