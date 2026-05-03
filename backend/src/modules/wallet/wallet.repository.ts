import { supabase } from '../../config/supabase';
import { PaginationQuery } from '../../types';

export class WalletRepository {
  async findByUserId(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data;
  }

  async getOrCreate(userId: string): Promise<any> {
    const { data: existing, error: findError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!findError && existing) return existing;

    const { data: wallet, error: insertError } = await supabase
      .from('wallets')
      .insert({ user_id: userId })
      .select()
      .single();

    if (insertError) throw insertError;
    return wallet;
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
      data,
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
}
