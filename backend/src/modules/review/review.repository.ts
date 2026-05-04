import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

function mapReviewRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    serviceType: row.service_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ReviewRepository {
  async create(data: {
    userId: string;
    serviceType: string;
    serviceId: string;
    rating: number;
    comment: string;
  }): Promise<any> {
    const { data: row, error } = await supabase
      .from('reviews')
      .insert({
        user_id: data.userId,
        service_type: data.serviceType,
        service_id: data.serviceId,
        rating: data.rating,
        comment: data.comment,
      })
      .select()
      .single();

    if (error) throw error;
    return mapReviewRow(row as Record<string, unknown>);
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(name, avatar)')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return data ? mapReviewRow(data as Record<string, unknown>) : null;
  }

  async findByServiceId(serviceId: string, query: PaginationQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(name, avatar)', { count: 'exact' })
      .eq('service_id', serviceId)
      .eq('is_deleted', false)
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = count ?? 0;
    return {
      data: (data || []).map(r => mapReviewRow(r as Record<string, unknown>)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findByUser(userId: string, serviceId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('service_id', serviceId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) return null;
    return data ? mapReviewRow(data as Record<string, unknown>) : null;
  }

  async softDelete(id: string): Promise<void> {
    await supabase.from('reviews').update({ is_deleted: true }).eq('id', id);
  }

  async getAverageRating(serviceId: string): Promise<{ avgRating: number; totalReviews: number }> {
    const { data } = await supabase
      .from('reviews')
      .select('rating')
      .eq('service_id', serviceId)
      .eq('is_deleted', false);

    const rows = data ?? [];
    if (!rows.length) return { avgRating: 0, totalReviews: 0 };

    const sum = rows.reduce((s: number, r: { rating: number }) => s + Number(r.rating ?? 0), 0);

    return { avgRating: sum / rows.length, totalReviews: rows.length };
  }
}
