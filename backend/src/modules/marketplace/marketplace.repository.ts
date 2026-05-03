import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

export class MarketplaceRepository {
  async createItem(data: any): Promise<any> {
    const { data: item, error } = await supabase
      .from('marketplace_items')
      .insert({
        seller_id: data.sellerId,
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        condition: data.condition,
        images: data.images,
        dynamic_fields: data.dynamicFields,
        location: data.location,
      })
      .select()
      .single();

    if (error) throw error;
    return item;
  }

  async findItemById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*, profiles:seller_id(name, email, phone)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateItem(id: string, data: any): Promise<any | null> {
    const { data: item, error } = await supabase
      .from('marketplace_items')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return item;
  }

  async softDeleteItem(id: string): Promise<void> {
    await supabase
      .from('marketplace_items')
      .update({ is_deleted: true })
      .eq('id', id);
  }

  async findAllItems(filter: Record<string, any>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    let baseQuery = supabase
      .from('marketplace_items')
      .select('*, profiles:seller_id(name, email)', { count: 'exact' })
      .eq('is_deleted', false);

    if (filter.category) baseQuery = baseQuery.eq('category', filter.category);
    if (filter.isSold !== undefined) baseQuery = baseQuery.eq('is_sold', filter.isSold);

    const { data, error, count } = await baseQuery
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

  async findItemsByUser(userId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('marketplace_items')
      .select('*', { count: 'exact' })
      .eq('seller_id', userId)
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
    return data;
  }

  async reportItem(id: string, reason: string): Promise<any | null> {
    // Supabase RPC or fetch-update
    const { data: current } = await supabase.from('marketplace_items').select('report_count, report_reasons').eq('id', id).single();
    const newReasons = [...(current?.report_reasons || []), reason];
    
    const { data, error } = await supabase
      .from('marketplace_items')
      .update({
        report_count: (current?.report_count || 0) + 1,
        report_reasons: newReasons,
        is_reported: true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  // Messages
  async createMessage(data: any): Promise<any> {
    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        content: data.content,
      })
      .select()
      .single();

    if (error) throw error;
    return msg;
  }

  async getConversation(userId1: string, userId2: string, itemId?: string, query?: PaginationQuery) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    let baseQuery = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`);

    const { data, error, count } = await baseQuery
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: true });

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

  async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by other user in JS for now (Supabase RPC would be better)
    const conversations = new Map();
    data.forEach(msg => {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations.has(otherId)) {
        conversations.set(otherId, {
          lastMessage: msg,
          unreadCount: (msg.receiver_id === userId && !msg.is_read) ? 1 : 0
        });
      } else if (msg.receiver_id === userId && !msg.is_read) {
        conversations.get(otherId).unreadCount++;
      }
    });

    return Array.from(conversations.entries()).map(([id, info]) => ({
      _id: id,
      ...info
    }));
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false);
  }

  // Offers
  async createOffer(data: any): Promise<any> {
    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        item_id: data.itemId,
        amount: data.amount,
      })
      .select()
      .single();

    if (error) throw error;
    return offer;
  }

  async findOfferById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('offers')
      .select('*, marketplace_items(*), profiles:sender_id(name, email, phone), receiver:receiver_id(name, email, phone)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async updateOfferStatus(id: string, status: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async findOffersByBuyer(buyerId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('offers')
      .select('*, marketplace_items(title, price, images, category), profiles:receiver_id(name, email, phone)', { count: 'exact' })
      .eq('sender_id', buyerId)
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

  async findOffersBySeller(sellerId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('offers')
      .select('*, marketplace_items(title, price, images, category), profiles:sender_id(name, email, phone)', { count: 'exact' })
      .eq('receiver_id', sellerId)
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

  async findOffersForItem(itemId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('offers')
      .select('*, profiles:sender_id(name, email, phone)', { count: 'exact' })
      .eq('item_id', itemId)
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
}
