import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

function mapMarketplaceItemRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    vendorId: row.vendor_id,
    isSold: row.is_sold,
    approvalStatus: row.approval_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOfferRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    itemId: row.item_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    offeredPrice: row.offered_price || (row as any).amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MarketplaceRepository {
  async create(data: any): Promise<any> {
    const { data: item, error } = await supabase
      .from('marketplace_items')
      .insert({
        vendor_id: data.vendorId,
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition,
        images: data.images,
        location: data.location,
        is_sold: false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapMarketplaceItemRow(item as Record<string, unknown>);
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*, profiles:vendor_id(name, email, phone)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    
    if (error) return null;
    return mapMarketplaceItemRow(data as Record<string, unknown>);
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('marketplace_items')
      .select('*, profiles:vendor_id(name, email, phone)', { count: 'exact' })
      .eq('is_deleted', false);

    if (filter.category) baseQuery = baseQuery.eq('category', filter.category);
    if (filter.isSold !== undefined) baseQuery = baseQuery.eq('is_sold', filter.isSold);
    if (filter.condition) baseQuery = baseQuery.eq('condition', filter.condition);
    
    if (filter.location) {
      baseQuery = baseQuery.ilike('location', `%${filter.location}%`);
    }
    
    if (filter.search) {
      baseQuery = baseQuery.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    if (filter.minPrice) baseQuery = baseQuery.gte('price', filter.minPrice);
    if (filter.maxPrice) baseQuery = baseQuery.lte('price', filter.maxPrice);

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapMarketplaceItemRow(r as Record<string, unknown>)),
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
      .from('marketplace_items')
      .select('*', { count: 'exact' })
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapMarketplaceItemRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async update(id: string, data: any): Promise<any | null> {
    const { data: item, error } = await supabase
      .from('marketplace_items')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapMarketplaceItemRow(item as Record<string, unknown>);
  }

  async softDelete(id: string): Promise<void> {
    await supabase.from('marketplace_items').update({ is_deleted: true }).eq('id', id);
  }

  async addImages(id: string, images: string[]): Promise<any | null> {
    const { data: current } = await supabase.from('marketplace_items').select('images').eq('id', id).single();
    const newImages = [...(current?.images || []), ...images];

    const { data, error } = await supabase
      .from('marketplace_items')
      .update({ images: newImages })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapMarketplaceItemRow(data as Record<string, unknown>);
  }

  // Offers
  async createOffer(data: any): Promise<any> {
    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        item_id: data.itemId,
        buyer_id: data.buyerId,
        seller_id: data.sellerId,
        offered_price: data.offeredPrice || data.amount,
        message: data.message,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return mapOfferRow(offer as Record<string, unknown>);
  }

  async findOffersByItem(itemId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('offers')
      .select('*, profiles:buyer_id(name, email, phone)')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(r => mapOfferRow(r as Record<string, unknown>));
  }

  async updateOfferStatus(offerId: string, status: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', offerId)
      .select()
      .single();

    if (error) return null;
    return mapOfferRow(data as Record<string, unknown>);
  }

  async findOffersByUser(userId: string, role: 'buyer' | 'seller') {
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
    const { data, error } = await supabase
      .from('offers')
      .select('*, itemId:item_id(*), buyerId:buyer_id(name, email), sellerId:seller_id(name, email)')
      .eq(column, userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => mapOfferRow(r as Record<string, unknown>));
  }
}
