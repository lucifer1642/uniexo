import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';
import { ListingApprovalStatus } from '../../types/enums';

export class HouseRepository {
  async create(data: any): Promise<any> {
    const { data: house, error } = await supabase
      .from('houses')
      .insert({
        vendor_id: data.vendorId,
        title: data.title,
        description: data.description,
        property_type: data.propertyType,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        price_per_month: data.pricePerMonth,
        price_per_day: data.pricePerDay,
        price_per_hour: data.pricePerHour,
        single_sharing_price: data.singleSharingPrice,
        double_sharing_price: data.doubleSharingPrice,
        triple_sharing_price: data.tripleSharingPrice,
        security_deposit: data.securityDeposit,
        lockin_period: data.lockinPeriod,
        notice_period: data.noticePeriod,
        electricity_included: data.electricityIncluded,
        electricity_charge: data.electricityCharge,
        images: data.images,
        amenities: data.amenities,
        rules: data.rules,
        faqs: data.faqs,
        location_url: data.locationUrl,
        rank: data.rank,
      })
      .select()
      .single();

    if (error) throw error;
    return house;
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('houses')
      .select('*, profiles:vendor_id(name, email, phone)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    const { data: house, error } = await supabase
      .from('houses')
      .update({
        title: data.title,
        description: data.description,
        property_type: data.propertyType,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        price_per_month: data.pricePerMonth,
        price_per_day: data.pricePerDay,
        price_per_hour: data.pricePerHour,
        single_sharing_price: data.singleSharingPrice,
        double_sharing_price: data.doubleSharingPrice,
        triple_sharing_price: data.tripleSharingPrice,
        security_deposit: data.securityDeposit,
        lockin_period: data.lockinPeriod,
        notice_period: data.noticePeriod,
        electricity_included: data.electricityIncluded,
        electricity_charge: data.electricityCharge,
        images: data.images,
        amenities: data.amenities,
        rules: data.rules,
        faqs: data.faqs,
        location_url: data.locationUrl,
        rank: data.rank,
        is_available: data.isAvailable,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return house;
  }

  async softDelete(id: string): Promise<void> {
    await supabase
      .from('houses')
      .update({ is_deleted: true })
      .eq('id', id);
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('houses')
      .select('*, profiles:vendor_id(name, email, phone)', { count: 'exact' })
      .eq('is_deleted', false);

    if (filter.approvalStatus) {
      baseQuery = baseQuery.eq('approval_status', filter.approvalStatus);
    }
    if (filter.propertyType) {
      baseQuery = baseQuery.eq('property_type', filter.propertyType);
    }

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('rank', { ascending: false })
      .order('title', { ascending: true });

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

  async findByVendor(vendorId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('houses')
      .select('*', { count: 'exact' })
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
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

  async updateApproval(id: string, status: ListingApprovalStatus, rejectionReason?: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('houses')
      .update({ approval_status: status, rejection_reason: rejectionReason })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async addImages(id: string, images: string[]): Promise<any | null> {
    const { data: current } = await supabase.from('houses').select('images').eq('id', id).single();
    const newImages = [...(current?.images || []), ...images];

    const { data, error } = await supabase
      .from('houses')
      .update({ images: newImages })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }
}
