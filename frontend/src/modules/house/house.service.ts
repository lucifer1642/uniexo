import { supabaseAdmin } from '@/lib/supabase-admin';
import type { HouseRow, HouseWithVendor, HouseInput } from './house.types';

export const houseService = {
  /**
   * List all non-deleted, available houses. Optionally filter by property type.
   */
  async list(filters?: { propertyType?: string }): Promise<{ success: boolean; data?: HouseWithVendor[]; error?: string }> {
    try {
      let query = supabaseAdmin
        .from('houses')
        .select('*, vendor:profiles!vendor_id(id, name, email, phone)')
        .eq('is_deleted', false)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (filters?.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[HOUSE SERVICE] list error:', error);
        return { success: false, error: 'Failed to fetch houses.' };
      }
      return { success: true, data: (data || []) as HouseWithVendor[] };
    } catch (err: any) {
      console.error('[HOUSE SERVICE] list error:', err);
      return { success: true, data: [] };
    }
  },

  /**
   * List all houses belonging to a specific vendor.
   */
  async listByVendor(vendorId: string): Promise<{ success: boolean; data?: HouseRow[]; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('houses')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[HOUSE SERVICE] listByVendor error:', error);
        return { success: false, error: 'Failed to fetch vendor houses.' };
      }
      return { success: true, data: (data || []) as HouseRow[] };
    } catch (err: any) {
      console.error('[HOUSE SERVICE] listByVendor error:', err);
      return { success: false, error: 'Failed to fetch houses.' };
    }
  },

  /**
   * Get single house by ID with vendor info.
   */
  async getById(id: string): Promise<{ success: boolean; data?: HouseWithVendor; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('houses')
        .select('*, vendor:profiles!vendor_id(id, name, email, phone)')
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: 'Property not found.' };
      }
      return { success: true, data: data as HouseWithVendor };
    } catch (err: any) {
      console.error('[HOUSE SERVICE] getById error:', err);
      return { success: false, error: 'Failed to fetch property.' };
    }
  },

  /**
   * Create a new house listing.
   */
  async create(vendorId: string, input: HouseInput): Promise<{ success: boolean; data?: HouseRow; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('houses')
        .insert({
          vendor_id: vendorId,
          title: input.title,
          description: input.description,
          property_type: input.propertyType,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          bedrooms: input.bedrooms || 1,
          bathrooms: input.bathrooms || 1,
          area: input.area || null,
          room_size: input.roomSize || null,
          bed_type: input.bedType || null,
          price_per_month: input.pricePerMonth || null,
          price_per_day: input.pricePerDay || null,
          single_sharing_price: input.singleSharingPrice || null,
          double_sharing_price: input.doubleSharingPrice || null,
          triple_sharing_price: input.tripleSharingPrice || null,
          security_deposit: input.securityDeposit || null,
          lockin_period: input.lockinPeriod || '0 months',
          notice_period: input.noticePeriod || '15 days',
          electricity_included: input.electricityIncluded ?? true,
          electricity_charge: input.electricityCharge || null,
          location_url: input.locationUrl || null,
          tenants_staying: input.tenantsStaying || 0,
          faqs: input.faqs || [],
          amenities: input.amenities || {},
          images: input.images || [],
          approval_status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[HOUSE SERVICE] create error:', error);
        return { success: false, error: 'Failed to add property.' };
      }
      return { success: true, data: data as HouseRow };
    } catch (err: any) {
      console.error('[HOUSE SERVICE] create error:', err);
      return { success: false, error: 'Failed to add property.' };
    }
  },

  /**
   * Soft-delete a house.
   */
  async delete(id: string, vendorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('houses')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('[HOUSE SERVICE] delete error:', error);
        return { success: false, error: 'Failed to delete property.' };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[HOUSE SERVICE] delete error:', err);
      return { success: false, error: 'Failed to delete property.' };
    }
  },

  /**
   * Upload image to Supabase Storage and return public URL.
   */
  async uploadImage(file: Buffer, fileName: string, contentType: string): Promise<string | null> {
    try {
      const path = `houses/${Date.now()}_${fileName}`;
      const { error } = await supabaseAdmin.storage
        .from('house-images')
        .upload(path, file, { contentType, upsert: false });

      if (error) {
        console.error('[HOUSE SERVICE] upload error:', error);
        return null;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('house-images')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('[HOUSE SERVICE] upload error:', err);
      return null;
    }
  },
};
