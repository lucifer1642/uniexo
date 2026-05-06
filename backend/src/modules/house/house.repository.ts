import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';
import { ListingApprovalStatus } from '../../types/enums';
import { BadRequestError } from '../../utils/errors';
import { SlugUtils } from '../../utils/slug';

function mapHouseRow(row: any) {
  if (!row) return null;
  
  // Dynamic mapping: convert all snake_case to camelCase
  const mapped: any = { ...row };
  
  // Standard aliases for frontend compatibility
  mapped._id = row.id;
  mapped.id = row.id;
  mapped.vendorId = row.vendor_id || row.vendorId;
  mapped.propertyType = row.property_type || row.propertyType || 'house';
  mapped.roomSize = row.room_size || row.roomSize;
  mapped.bedType = row.bed_type || row.bedType;
  mapped.tenantsStaying = row.tenants_staying || row.tenantsStaying || 0;
  mapped.pricePerMonth = row.price_per_month || row.pricePerMonth || 0;
  mapped.pricePerDay = row.price_per_day || row.pricePerDay || 0;
  mapped.pricePerHour = row.price_per_hour || row.pricePerHour || 0;
  mapped.securityDeposit = row.security_deposit || row.securityDeposit || 0;
  mapped.lockinPeriod = row.lockin_period || row.lockinPeriod;
  mapped.noticePeriod = row.notice_period || row.noticePeriod;
  mapped.locationUrl = row.location_url || row.locationUrl || row.google_maps_link || row.googleMapsLink;
  mapped.commonAmenities = row.common_amenities || row.commonAmenities || [];
  mapped.roomAmenities = row.room_amenities || row.roomAmenities || [];
  mapped.servicesAmenities = row.services_amenities || row.servicesAmenities || row.services || [];
  mapped.foodAmenities = row.food_amenities || row.foodAmenities || row.food || [];
  mapped.approvalStatus = row.approval_status || row.approvalStatus || 'pending';
  mapped.isAvailable = row.is_available ?? row.isAvailable ?? true;
  mapped.createdAt = row.created_at || row.createdAt;
  mapped.updatedAt = row.updated_at || row.updatedAt;
  
  // Joined vendor data
  if (row.profiles) mapped.vendor = row.profiles;
  if (row.vendor_profiles) mapped.vendorProfile = row.vendor_profiles;

  return mapped;
}

export class HouseRepository {
  async create(data: any): Promise<any> {
    const insertData: any = {
      vendor_id: data.vendorId || data.vendor_id,
      name: String(data.name || data.title || 'Untitled Property'),
      slug: data.slug || SlugUtils.generate(String(data.name || data.title || 'house') + '-' + Date.now().toString().slice(-4)),
      description: String(data.description || ''),
      property_type: String(data.propertyType || data.property_type || 'house'),
      address: String(data.address || ''),
      city: String(data.city || ''),
      state: String(data.state || ''),
      pincode: String(data.pincode || ''),
      bedrooms: Number(data.bedrooms || 0),
      bathrooms: Number(data.bathrooms || 0),
      area: Number(data.area || 0),
      price_per_day: Number(data.pricePerDay || data.price_per_day || 0),
      price_per_month: Number(data.pricePerMonth || data.price_per_month || 0),
      is_available: true,
      approval_status: 'approved', // Default to approved for robust mode
      images: Array.isArray(data.images) ? data.images : [],
    };

    // Add optional fields only if they are provided to avoid "column not found" or "not null" issues
    if (data.roomSize || data.room_size) insertData.room_size = data.roomSize || data.room_size;
    if (data.bedType || data.bed_type) insertData.bed_type = data.bedType || data.bed_type;
    if (data.tenantsStaying || data.tenants_staying) insertData.tenants_staying = Number(data.tenantsStaying || data.tenants_staying);
    if (data.securityDeposit || data.security_deposit) insertData.security_deposit = Number(data.securityDeposit || data.security_deposit);
    if (data.lockinPeriod || data.lockin_period) insertData.lockin_period = data.lockinPeriod || data.lockin_period;
    if (data.noticePeriod || data.notice_period) insertData.notice_period = data.noticePeriod || data.notice_period;
    if (data.locationUrl || data.location_url || data.googleMapsLink) {
        insertData.location_url = data.locationUrl || data.location_url || data.googleMapsLink;
    }

    try {
        const { data: house, error } = await supabase
          .from('houses')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('[HOUSE-REPO] Primary insert failed, trying minimal:', error);
          // Minimal fallback
          const minimalData = {
              vendor_id: insertData.vendor_id,
              name: insertData.name,
              price_per_day: insertData.price_per_day,
              slug: insertData.slug
          };
          const { data: fallbackHouse, error: fallbackError } = await supabase
            .from('houses')
            .insert(minimalData)
            .select()
            .single();
            
          if (fallbackError) throw fallbackError;
          return mapHouseRow(fallbackHouse);
        }
        return mapHouseRow(house);
    } catch (err: any) {
        console.error('[HOUSE-REPO] ALL INSERTS FAILED:', err);
        throw err;
    }
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
