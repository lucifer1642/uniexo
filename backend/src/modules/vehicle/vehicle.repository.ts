import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';
import { ListingApprovalStatus } from '../../types/enums';

export class VehicleRepository {
  async create(data: any): Promise<any> {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        vendor_id: data.vendorId,
        name: data.name,
        type: data.type,
        brand: data.brand,
        model_name: data.modelName,
        year: data.year,
        registration_number: data.registrationNumber,
        fuel_type: data.fuelType,
        seating_capacity: data.seatingCapacity,
        price_per_hour: data.pricePerHour,
        price_per_day: data.pricePerDay,
        images: data.images,
        description: data.description,
        features: data.features,
        location: data.location,
        availability: data.availability,
        rank: data.rank,
      })
      .select()
      .single();

    if (error) throw error;
    return vehicle;
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, profiles:vendor_id(name, email, phone)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    
    if (error) return null;
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({
        name: data.name,
        type: data.type,
        brand: data.brand,
        model_name: data.modelName,
        year: data.year,
        registration_number: data.registrationNumber,
        fuel_type: data.fuelType,
        seating_capacity: data.seatingCapacity,
        price_per_hour: data.pricePerHour,
        price_per_day: data.pricePerDay,
        images: data.images,
        description: data.description,
        features: data.features,
        location: data.location,
        availability: data.availability,
        current_status: data.currentStatus,
        rank: data.rank,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return vehicle;
  }

  async softDelete(id: string): Promise<void> {
    await supabase
      .from('vehicles')
      .update({ is_deleted: true })
      .eq('id', id);
  }

  async findAll(filter: Record<string, unknown>, query: PaginationQuery) {
    const skip = (query.page - 1) * query.limit;
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

    const { data, error, count } = await baseQuery
      .range(skip, skip + query.limit - 1)
      .order('rank', { ascending: false })
      .order('name', { ascending: true });

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

  async findByVendor(vendorId: string, query: PaginationQuery) {
    const skip = (query.page - 1) * query.limit;
    const { data, error, count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
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
    return data;
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
    return data;
  }

  async addImages(id: string, images: string[]): Promise<any | null> {
    // In Supabase, we fetch current images then append
    const { data: current } = await supabase.from('vehicles').select('images').eq('id', id).single();
    const newImages = [...(current?.images || []), ...images];
    
    const { data, error } = await supabase
      .from('vehicles')
      .update({ images: newImages })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }
}
