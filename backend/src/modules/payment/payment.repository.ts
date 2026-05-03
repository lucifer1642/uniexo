import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';
import { PaymentStatus } from '../../types/enums';

function mapPaymentRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    serviceType: row.service_type,
    referenceId: row.reference_id,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : Number(row.amount),
    currency: row.currency,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpaySignature: row.razorpay_signature,
    status: row.status,
    receipt: row.receipt,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PaymentRepository {
  async create(data: {
    userId: string;
    serviceType: string;
    referenceId: string;
    amount: number;
    razorpayOrderId: string;
    receipt: string;
    status: PaymentStatus;
    currency?: string;
  }): Promise<any> {
    const { data: row, error } = await supabase
      .from('payments')
      .insert({
        user_id: data.userId,
        service_type: data.serviceType,
        reference_id: data.referenceId,
        amount: data.amount,
        razorpay_order_id: data.razorpayOrderId,
        receipt: data.receipt,
        status: data.status,
        currency: data.currency || 'INR',
      })
      .select()
      .single();

    if (error) throw error;
    return mapPaymentRow(row as Record<string, unknown>);
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*, profiles:user_id(name, email)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) return null;
    return mapPaymentRow(data as Record<string, unknown>);
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('is_deleted', false)
      .single();

    if (error) return null;
    return mapPaymentRow(data as Record<string, unknown>);
  }

  async update(
    id: string,
    data: Partial<{
      razorpayPaymentId: string;
      razorpaySignature: string;
      status: PaymentStatus;
    }>,
  ): Promise<any | null> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.razorpayPaymentId !== undefined) patch.razorpay_payment_id = data.razorpayPaymentId;
    if (data.razorpaySignature !== undefined) patch.razorpay_signature = data.razorpaySignature;
    if (data.status !== undefined) patch.status = data.status;

    const { data: row, error } = await supabase
      .from('payments')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return mapPaymentRow(row as Record<string, unknown>);
  }

  async findByUser(userId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map((r) => mapPaymentRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findAll(filter: Record<string, unknown>, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    let base = supabase
      .from('payments')
      .select('*, profiles:user_id(name, email)', { count: 'exact' })
      .eq('is_deleted', false);

    if (filter.status) base = base.eq('status', filter.status as string);

    const { data, error, count } = await base
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map((r) => mapPaymentRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    };
  }
}
