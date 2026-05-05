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
    status: row.status,
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
        approval_status: data.approvalStatus || 'approved',
        is_available: true,
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
    const patch: Record<string, any> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.price !== undefined) patch.price = data.price;
    if (data.category !== undefined) patch.category = data.category;
    if (data.condition !== undefined) patch.condition = data.condition;
    if (data.images !== undefined) patch.images = data.images;
    if (data.location !== undefined) patch.location = data.location;
    if (data.isSold !== undefined) patch.is_sold = data.isSold;
    if (data.isAvailable !== undefined) patch.is_available = data.isAvailable;
    if (data.approvalStatus !== undefined) patch.approval_status = data.approvalStatus;

    const { data: item, error } = await supabase
      .from('marketplace_items')
      .update(patch)
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

  // Messaging / Chat
  async createMessage(data: { senderId: string; receiverId: string; itemId?: string; content: string }) {
    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        item_id: data.itemId,
        content: data.content,
        is_read: false,
      })
      .select('*, sender:sender_id(name, avatar), receiver:receiver_id(name, avatar)')
      .single();

    if (error) throw error;
    return msg;
  }

  async getConversation(userId: string, otherUserId: string, itemId?: string, query?: PaginationQuery) {
    const limit = query?.limit || 50;
    let base = supabase
      .from('messages')
      .select('*, sender:sender_id(name, avatar), receiver:receiver_id(name, avatar)')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`);

    if (itemId) {
      base = base.eq('item_id', itemId);
    }

    const { data, error } = await base
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
  }

  async getUserConversations(userId: string) {
    // This is complex in Supabase/SQL to get "latest message per conversation".
    // For now, get all unique partners.
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at, item_id, sender:sender_id(name, avatar), receiver:receiver_id(name, avatar)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Group by partner
    const conversations = new Map();
    (data || []).forEach(msg => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partnerId,
          partnerName: msg.sender_id === userId ? (msg.receiver as any)?.name : (msg.sender as any)?.name,
          partnerAvatar: msg.sender_id === userId ? (msg.receiver as any)?.avatar : (msg.sender as any)?.avatar,
          lastMessage: msg.content,
          timestamp: msg.created_at,
          itemId: msg.item_id
        });
      }
    });

    return Array.from(conversations.values());
  }

  async markMessagesAsRead(senderId: string, receiverId: string) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false);
  }

  // Reporting
  async reportItem(itemId: string, reason: string) {
    const { data: item } = await supabase.from('marketplace_items').select('report_count, report_reasons').eq('id', itemId).single();
    const count = (item?.report_count || 0) + 1;
    const reasons = [...(item?.report_reasons || []), reason];

    await supabase
      .from('marketplace_items')
      .update({ 
        report_count: count, 
        report_reasons: reasons,
        is_reported: true 
      })
      .eq('id', itemId);
  }

  // Aliases for Service compatibility
  async createItem(data: any) { return this.create(data); }
  async findItemById(id: string) { return this.findById(id); }
  async updateItem(id: string, data: any) { return this.update(id, data); }
  async softDeleteItem(id: string) { return this.softDelete(id); }
  async findAllItems(filter: any, query: any) { return this.findAll(filter, query); }
  async findItemsByUser(userId: string, query: any) { return this.findByVendor(userId, query); }
  async findOffersByBuyer(userId: string, query: any) { return this.findOffersByUser(userId, 'buyer'); }
  async findOffersBySeller(userId: string, query: any) { return this.findOffersByUser(userId, 'seller'); }
  async findOffersForItem(itemId: string, query: any) { return this.findOffersByItem(itemId); }
  async findOfferById(id: string) {
    const { data, error } = await supabase.from('offers').select('*, buyerId:buyer_id(name, email), sellerId:seller_id(name, email), itemId:item_id(title)').eq('id', id).single();
    if (error) return null;
    return mapOfferRow(data as Record<string, unknown>);
  }
}
