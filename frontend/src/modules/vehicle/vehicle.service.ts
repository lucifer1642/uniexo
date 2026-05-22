import { supabaseAdmin } from '@/lib/supabase-admin';
import type { VehicleRow, VehicleWithVendor, VehicleInput } from './vehicle.types';

export const vehicleService = {
  /**
   * List all non-deleted, available vehicles. Optionally filter by type.
   */
  async list(filters?: { type?: string }): Promise<{ success: boolean; data?: VehicleWithVendor[]; error?: string }> {
    try {
      let query = supabaseAdmin
        .from('vehicles')
        .select('*, vendor:profiles!vendor_id(id, name, email, phone)')
        .eq('is_deleted', false)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[VEHICLE SERVICE] list error:', error);
        return { success: false, error: 'Failed to fetch vehicles.' };
      }
      return { success: true, data: (data || []) as VehicleWithVendor[] };
    } catch (err: any) {
      console.error('[VEHICLE SERVICE] list error:', err);
      return { success: true, data: [] };
    }
  },

  /**
   * Get single vehicle by ID with vendor info.
   */
  async getById(id: string): Promise<{ success: boolean; data?: VehicleWithVendor; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select('*, vendor:profiles!vendor_id(id, name, email, phone)')
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: 'Vehicle not found.' };
      }
      return { success: true, data: data as VehicleWithVendor };
    } catch (err: any) {
      console.error('[VEHICLE SERVICE] getById error:', err);
      return { success: false, error: 'Failed to fetch vehicle.' };
    }
  },

  /**
   * Create a new vehicle listing.
   */
  async create(vendorId: string, input: VehicleInput): Promise<{ success: boolean; data?: VehicleRow; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .insert({
          vendor_id: vendorId,
          name: input.name,
          type: input.type,
          brand: input.brand,
          model: input.model,
          year: input.year,
          registration_number: input.registration_number,
          fuel_type: input.fuel_type || 'Petrol',
          seating_capacity: input.seating_capacity || 2,
          price_per_hour: input.price_per_hour || null,
          price_per_day: input.price_per_day,
          description: input.description || null,
          location: input.location || null,
          images: input.images || [],
          approval_status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[VEHICLE SERVICE] create error:', error);
        if (error.code === '23505') return { success: false, error: 'A vehicle with this registration number already exists.' };
        return { success: false, error: 'Failed to add vehicle.' };
      }
      return { success: true, data: data as VehicleRow };
    } catch (err: any) {
      console.error('[VEHICLE SERVICE] create error:', err);
      return { success: false, error: 'Failed to add vehicle.' };
    }
  },

  /**
   * Soft-delete a vehicle (vendor or admin only).
   */
  async delete(id: string, vendorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('vehicles')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('[VEHICLE SERVICE] delete error:', error);
        return { success: false, error: 'Failed to delete vehicle.' };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[VEHICLE SERVICE] delete error:', err);
      return { success: false, error: 'Failed to delete vehicle.' };
    }
  },

  /**
   * Upload image to Supabase Storage and return public URL.
   */
  async uploadImage(file: Buffer, fileName: string, contentType: string): Promise<string | null> {
    try {
      const path = `vehicles/${Date.now()}_${fileName}`;
      const { error } = await supabaseAdmin.storage
        .from('vehicle-images')
        .upload(path, file, { contentType, upsert: false });

      if (error) {
        console.error('[VEHICLE SERVICE] upload error:', error);
        return null;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('vehicle-images')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('[VEHICLE SERVICE] upload error:', err);
      return null;
    }
  },
};
