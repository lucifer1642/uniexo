import { Wallet, IWallet, Transaction, ITransaction } from '../../database/models';
import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';

export class WalletRepository {
  async findByUserId(userId: string): Promise<IWallet | null> {
    return Wallet.findOne({ userId }).exec();
  }

  async getOrCreate(userId: string): Promise<IWallet> {
    let wallet = await Wallet.findOne({ userId }).exec();
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }
    return wallet;
  }

  async getTransactions(walletId: string, query: PaginationQuery) {
    return paginate(Transaction, { walletId }, query);
  }

  async getUserTransactions(userId: string, query: PaginationQuery) {
    return paginate(Transaction, { userId }, query);
  }
}
