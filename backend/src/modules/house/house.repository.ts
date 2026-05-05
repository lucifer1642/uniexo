import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';
import { ListingApprovalStatus } from '../../types/enums';
import { BadRequestError } from '../../utils/errors';
import { SlugUtils } from '../../utils/slug';

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
    vendor: row.profiles, // Include joined profile data
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class HouseRepository {
  async create(data: any): Promise<any> {
    const insertData = {
      vendor_id: data.vendorId || data.vendor_id,
      name: String(data.name || data.title || ''),
      slug: data.slug || SlugUtils.generate(String(data.name || data.title || 'house')),
      description: String(data.description || ''),
      property_type: String(data.propertyType || data.property_type || 'apartment'),
      address: String(data.address || ''),
      city: String(data.city || ''),
      state: String(data.state || ''),
      pincode: String(data.pincode || ''),
      bedrooms: Number(data.bedrooms || 0),
      bathrooms: Number(data.bathrooms || 0),
      area: Number(data.area || 0),
      room_size: data.roomSize || data.room_size || null,
      bed_type: data.bedType || data.bed_type || null,
      tenants_staying: Number(data.tenantsStaying || data.tenants_staying || 0),
      price_per_month: Number(data.pricePerMonth || data.price_per_month || 0),
      price_per_day: Number(data.pricePerDay || data.price_per_day || 0),
      price_per_hour: Number(data.pricePerHour || data.price_per_hour || 0),
      single_sharing_price: Number(data.singleSharingPrice || data.single_sharing_price || 0),
      double_sharing_price: Number(data.doubleSharingPrice || data.double_sharing_price || 0),
      triple_sharing_price: Number(data.tripleSharingPrice || data.triple_sharing_price || 0),
      security_deposit: Number(data.securityDeposit || data.security_deposit || 0),
      lockin_period: data.lockinPeriod || data.lockin_period || null,
      notice_period: data.noticePeriod || data.notice_period || null,
      electricity_included: Boolean(data.electricityIncluded ?? data.electricity_included ?? true),
      electricity_charge: Number(data.electricityCharge || data.electricity_charge || 0),
      images: Array.isArray(data.images) ? data.images : [],
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      common_amenities: Array.isArray(data.commonAmenities || data.common_amenities) ? (data.commonAmenities || data.common_amenities) : [],
      room_amenities: Array.isArray(data.roomAmenities || data.room_amenities) ? (data.roomAmenities || data.room_amenities) : [],
      services_amenities: Array.isArray(data.servicesAmenities || data.services_amenities) ? (data.servicesAmenities || data.services_amenities) : [],
      food_amenities: Array.isArray(data.foodAmenities || data.food_amenities) ? (data.foodAmenities || data.food_amenities) : [],
      rules: Array.isArray(data.rules) ? data.rules : [],
      faqs: Array.isArray(data.faqs) ? data.faqs : [],
      location_url: data.locationUrl || data.location_url || null,
      rank: Number(data.rank || 0),
      approval_status: data.approvalStatus || data.approval_status || 'pending',
      is_available: Boolean(data.isAvailable ?? data.is_available ?? true),
    };

    const { data: house, error } = await supabase
      .from('houses')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[HOUSE-REPO] Create failed:', error);
      throw error;
    }
    return mapHouseRow(house as Record<string, unknown>);
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('houses')
      .select('*, profiles:vendor_id(name, email, phone)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    
    if (error) return null;
    return mapHouseRow(data as Record<string, unknown>);
  }

  async update(id: string, data: any): Promise<any | null> {
    const patch: Record<string, any> = {};
    if (data.name !== undefined || data.title !== undefined) patch.name = data.name || data.title;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.description !== undefined) patch.description = data.description;
    if (data.propertyType !== undefined) patch.property_type = data.propertyType;
    if (data.address !== undefined) patch.address = data.address;
    if (data.city !== undefined) patch.city = data.city;
    if (data.state !== undefined) patch.state = data.state;
    if (data.pincode !== undefined) patch.pincode = data.pincode;
    if (data.bedrooms !== undefined) patch.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) patch.bathrooms = data.bathrooms;
    if (data.area !== undefined) patch.area = data.area;
    if (data.roomSize !== undefined) patch.room_size = data.roomSize;
    if (data.bedType !== undefined) patch.bed_type = data.bedType;
    if (data.tenantsStaying !== undefined) patch.tenants_staying = data.tenantsStaying;
    if (data.pricePerMonth !== undefined) patch.price_per_month = data.pricePerMonth;
    if (data.pricePerDay !== undefined) patch.price_per_day = data.pricePerDay;
    if (data.pricePerHour !== undefined) patch.price_per_hour = data.pricePerHour;
    if (data.singleSharingPrice !== undefined) patch.single_sharing_price = data.singleSharingPrice;
    if (data.doubleSharingPrice !== undefined) patch.double_sharing_price = data.doubleSharingPrice;
    if (data.tripleSharingPrice !== undefined) patch.triple_sharing_price = data.tripleSharingPrice;
    if (data.securityDeposit !== undefined) patch.security_deposit = data.securityDeposit;
    if (data.lockinPeriod !== undefined) patch.lockin_period = data.lockinPeriod;
    if (data.noticePeriod !== undefined) patch.notice_period = data.noticePeriod;
    if (data.electricityIncluded !== undefined) patch.electricity_included = data.electricityIncluded;
    if (data.electricityCharge !== undefined) patch.electricity_charge = data.electricityCharge;
    if (data.images !== undefined) patch.images = data.images;
    if (data.amenities !== undefined) patch.amenities = data.amenities;
    if (data.commonAmenities !== undefined) patch.common_amenities = data.commonAmenities;
    if (data.roomAmenities !== undefined) patch.room_amenities = data.roomAmenities;
    if (data.servicesAmenities !== undefined) patch.services_amenities = data.servicesAmenities;
    if (data.foodAmenities !== undefined) patch.food_amenities = data.foodAmenities;
    if (data.rules !== undefined) patch.rules = data.rules;
    if (data.faqs !== undefined) patch.faqs = data.faqs;
    if (data.locationUrl !== undefined) patch.location_url = data.locationUrl;
    if (data.rank !== undefined) patch.rank = data.rank;
    if (data.isAvailable !== undefined) patch.is_available = data.isAvailable;
    if (data.approvalStatus !== undefined) patch.approval_status = data.approvalStatus;
    
    if (Object.keys(patch).length === 0) {
      throw new BadRequestError('no updatable fields provided');
    }

    const { data: house, error } = await supabase
      .from('houses')
      .update(patch)
      .eq('id', id)
      .eq('is_deleted', false)
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
    const updateData: any = { is_available: isAvailable };
    if (!isAvailable) {
      updateData.booked_at = new Date().toISOString();
    } else {
      updateData.booked_at = null;
    }

    const { data, error } = await supabase
      .from('houses')
      .update(updateData)
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
