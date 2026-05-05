import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';
import { ListingApprovalStatus } from '../../types/enums';

function mapHouseRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    vendorId: row.vendor_id,
    propertyType: row.property_type,
    roomSize: row.room_size,
    bedType: row.bed_type,
    tenantsStaying: row.tenants_staying,
    pricePerMonth: row.price_per_month,
    pricePerDay: row.price_per_day,
    pricePerHour: row.price_per_hour,
    singleSharingPrice: row.single_sharing_price,
    doubleSharingPrice: row.double_sharing_price,
    tripleSharingPrice: row.triple_sharing_price,
    securityDeposit: row.security_deposit,
    lockinPeriod: row.lockin_period,
    noticePeriod: row.notice_period,
    electricityIncluded: row.electricity_included,
    electricityCharge: row.electricity_charge,
    locationUrl: row.location_url,
    commonAmenities: row.common_amenities,
    roomAmenities: row.room_amenities,
    servicesAmenities: row.services_amenities,
    foodAmenities: row.food_amenities,
    approvalStatus: row.approval_status,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
        room_size: data.roomSize,
        bed_type: data.bedType,
        tenants_staying: data.tenantsStaying,
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
        common_amenities: data.commonAmenities,
        room_amenities: data.roomAmenities,
        services_amenities: data.servicesAmenities,
        food_amenities: data.foodAmenities,
        rules: data.rules,
        faqs: data.faqs,
        location_url: data.locationUrl,
        rank: data.rank,
      })
      .select()
      .single();

    if (error) throw error;
    return mapHouseRow(house as Record<string, unknown>);
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('houses')
      .select('*, profiles:vendor_id(name, email, phone)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return mapHouseRow(data as Record<string, unknown>);
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
        room_size: data.roomSize,
        bed_type: data.bedType,
        tenants_staying: data.tenantsStaying,
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
        common_amenities: data.commonAmenities,
        room_amenities: data.roomAmenities,
        services_amenities: data.servicesAmenities,
        food_amenities: data.foodAmenities,
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
    return mapHouseRow(house as Record<string, unknown>);
  }

  async softDelete(id: string): Promise<void> {
    await supabase
      .from('houses')
      .update({ is_deleted: true })
      .eq('id', id);
  }

  async setListedAvailability(id: string, isAvailable: boolean): Promise<any | null> {
    const { data, error } = await supabase
      .from('houses')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapHouseRow(data as Record<string, unknown>);
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

    if (filter.isAvailable === true) {
      baseQuery = baseQuery.eq('is_available', true);
    }

    if (filter.city && typeof filter.city === 'string') {
      baseQuery = baseQuery.ilike('city', `%${filter.city}%`);
    }

    if (filter.state && typeof filter.state === 'string') {
      baseQuery = baseQuery.ilike('state', `%${filter.state}%`);
    }
    if (filter.bedrooms) {
      baseQuery = baseQuery.eq('bedrooms', filter.bedrooms);
    }
    if (filter.minPrice) {
      baseQuery = baseQuery.gte('price_per_month', filter.minPrice);
    }
    if (filter.maxPrice) {
      baseQuery = baseQuery.lte('price_per_month', filter.maxPrice);
    }

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('rank', { ascending: false })
      .order('title', { ascending: true });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapHouseRow(r as Record<string, unknown>)),
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
      data: (data || []).map(r => mapHouseRow(r as Record<string, unknown>)),
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
    return mapHouseRow(data as Record<string, unknown>);
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
    return mapHouseRow(data as Record<string, unknown>);
  }
}
