import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

function mapWalletRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    userId: row.user_id,
  };
}

function mapTransactionRow(row: Record<string, unknown>) {
  return {
    ...row,
    _id: row.id,
    id: row.id,
    walletId: row.wallet_id,
    userId: row.user_id,
    referenceId: row.reference_id,
    serviceType: row.service_type,
    balanceAfter: row.balance_after,
  };
}

export class WalletRepository {
  async findByUserId(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return mapWalletRow(data as Record<string, unknown>);
  }

  async getOrCreate(userId: string): Promise<any> {
    const { data: existing, error: findError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!findError && existing) return mapWalletRow(existing as Record<string, unknown>);

    const { data: wallet, error: insertError } = await supabase
      .from('wallets')
      .insert({ user_id: userId })
      .select()
      .single();

    if (insertError) throw insertError;
    return mapWalletRow(wallet as Record<string, unknown>);
  }

  async getTransactions(walletId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('wallet_id', walletId)
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map(r => mapTransactionRow(r as Record<string, unknown>)),
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getUserTransactions(userId: string, query: PaginationQuery) {
    const wallet = await this.findByUserId(userId);
    if (!wallet) return { data: [], pagination: { total: 0, page: 1, limit: query.limit || 10, pages: 0 } };
    return this.getTransactions(wallet.id, query);
  }

  async incrementBalance(userId: string, delta: number): Promise<{ walletId: string; balance: number } | null> {
    const wallet = await this.getOrCreate(userId);
    const prev = Number(wallet.balance || 0);
    const balance = prev + delta;
    const { data, error } = await supabase
      .from('wallets')
      .update({ balance })
      .eq('id', wallet.id)
      .select()
      .single();

    if (error || !data) return null;
    return { walletId: data.id as string, balance: Number(data.balance ?? balance) };
  }

  async addTransaction(entry: {
    walletId: string;
    userId: string;
    type: string;
    amount: number;
    description: string;
    referenceId?: string;
    serviceType?: string;
    balanceAfter: number;
  }): Promise<void> {
    const { error } = await supabase.from('transactions').insert({
      wallet_id: entry.walletId,
      user_id: entry.userId,
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      reference_id: entry.referenceId ?? null,
      service_type: entry.serviceType ?? null,
      balance_after: entry.balanceAfter,
    });

    if (error) throw error;
  }
}
