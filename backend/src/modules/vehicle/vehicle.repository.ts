import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';
import { ListingApprovalStatus } from '../../types/enums';
import { BadRequestError } from '../../utils/errors';

function mapVehicleRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    vendorId: row.vendor_id,
    modelName: row.model_name,
    registrationNumber: row.registration_number,
    fuelType: row.fuel_type,
    seatingCapacity: row.seating_capacity,
    pricePerHour: row.price_per_hour,
    pricePerDay: row.price_per_day,
    approvalStatus: row.approval_status,
    isAvailable: row.is_available,
    currentStatus: row.current_status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class VehicleRepository {
  async create(data: any): Promise<any> {
    const insertData = {
      vendor_id: data.vendorId || data.vendor_id,
      name: String(data.name || ''),
      type: String(data.type || ''),
      brand: String(data.brand || ''),
      model_name: String(data.modelName || data.model_name || data.model || ''),
      year: Number(data.year || 0),
      registration_number: String(data.registrationNumber || data.registration_number || ''),
      fuel_type: String(data.fuelType || data.fuel_type || ''),
      seating_capacity: Number(data.seatingCapacity || data.seating_capacity || 0),
      price_per_hour: Number(data.pricePerHour || data.price_per_hour || 0),
      price_per_day: Number(data.pricePerDay || data.price_per_day || 0),
      images: Array.isArray(data.images) ? data.images : [],
      description: String(data.description || ''),
      features: Array.isArray(data.features) ? data.features : [],
      location: String(data.location || ''),
      availability: Array.isArray(data.availability) ? data.availability : [],
      rank: Number(data.rank || 0),
      approval_status: data.approvalStatus || data.approval_status || 'pending',
      is_available: Boolean(data.isAvailable ?? data.is_available ?? true),
      current_status: data.currentStatus || data.current_status || 'available',
    };

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[VEHICLE-REPO] Create failed:', error);
      throw error;
    }
    return mapVehicleRow(vehicle as Record<string, unknown>);
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, profiles:vendor_id(name, email, phone)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    
    if (error) return null;
    return mapVehicleRow(data as Record<string, unknown>);
  }

  async update(id: string, data: any): Promise<any | null> {
    const patch: Record<string, any> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.type !== undefined) patch.type = data.type;
    if (data.brand !== undefined) patch.brand = data.brand;
    if (data.modelName !== undefined) patch.model_name = data.modelName;
    if (data.year !== undefined) patch.year = data.year;
    if (data.registrationNumber !== undefined) patch.registration_number = data.registrationNumber;
    if (data.fuelType !== undefined) patch.fuel_type = data.fuelType;
    if (data.seatingCapacity !== undefined) patch.seating_capacity = data.seatingCapacity;
    if (data.pricePerHour !== undefined) patch.price_per_hour = data.pricePerHour;
    if (data.pricePerDay !== undefined) patch.price_per_day = data.pricePerDay;
    if (data.images !== undefined) patch.images = data.images;
    if (data.description !== undefined) patch.description = data.description;
    if (data.features !== undefined) patch.features = data.features;
    if (data.location !== undefined) patch.location = data.location;
    if (data.availability !== undefined) patch.availability = data.availability;
    if (data.currentStatus !== undefined) patch.current_status = data.currentStatus;
    if (data.rank !== undefined) patch.rank = data.rank;
    if (data.isAvailable !== undefined) patch.is_available = data.isAvailable;
    if (data.approvalStatus !== undefined) patch.approval_status = data.approvalStatus;
    
    if (Object.keys(patch).length === 0) {
      throw new BadRequestError('no updatable fields provided');
    }

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(patch)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) return null;
    return mapVehicleRow(vehicle as Record<string, unknown>);
  }

  async softDelete(id: string): Promise<void> {
    await supabase
      .from('vehicles')
      .update({ is_deleted: true })
      .eq('id', id);
  }

  async patchById(id: string, patch: Record<string, unknown>): Promise<any | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(patch)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) return null;
    return mapVehicleRow(data as Record<string, unknown>);
  }

  async findAll(filter: Record<string, unknown>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('vehicles')
      .select('*, profiles:vendor_id(name, email, phone)', { count: 'exact' })
      .eq('is_deleted', false);

    if (filter.approvalStatus) {
      baseQuery = baseQuery.eq('approval_status', filter.approvalStatus);
    }
    if (filter.type) {
      baseQuery = baseQuery.eq('type', filter.type);
    }

    if (filter.isAvailable === true) {
      baseQuery = baseQuery.eq('is_available', true);
    }

    if (filter.brand) {
      baseQuery = baseQuery.ilike('brand', `%${filter.brand}%`);
    }
    
    if (filter.location) {
      baseQuery = baseQuery.ilike('location', `%${filter.location}%`);
    }

    if (filter.minPrice) {
      baseQuery = baseQuery.gte('price_per_day', filter.minPrice);
    }

    if (filter.maxPrice) {
      baseQuery = baseQuery.lte('price_per_day', filter.maxPrice);
    }

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('rank', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapVehicleRow(r as Record<string, unknown>)),
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
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapVehicleRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findByVendorForFleet(vendorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false);

    if (error) return [];
    return (data || []).map(r => mapVehicleRow(r as Record<string, unknown>));
  }

  async updateAvailability(
    id: string,
    availability: any[],
  ): Promise<any | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ availability })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapVehicleRow(data as Record<string, unknown>);
  }

  async updateApproval(
    id: string,
    status: ListingApprovalStatus,
    rejectionReason?: string,
  ): Promise<any | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ approval_status: status, rejection_reason: rejectionReason })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapVehicleRow(data as Record<string, unknown>);
  }

  async addImages(id: string, images: string[]): Promise<any | null> {
    const { data: current } = await supabase.from('vehicles').select('images').eq('id', id).single();
    const newImages = [...(current?.images || []), ...images];
    
    const { data, error } = await supabase
      .from('vehicles')
      .update({ images: newImages })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapVehicleRow(data as Record<string, unknown>);
  }
}
