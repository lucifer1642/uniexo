import { WalletRepository } from './wallet.repository';
import { NotFoundError } from '../../utils/errors';
import { PaginationQuery } from '../../types';

export class WalletService {
  private walletRepo: WalletRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
  }

  async getWallet(userId: string) {
    const wallet = await this.walletRepo.getOrCreate(userId);
    return wallet;
  }

  async getTransactions(userId: string, query: PaginationQuery) {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) throw new NotFoundError('Wallet not found');
    return this.walletRepo.getTransactions(wallet._id.toString(), query);
  }

  async getUserTransactions(userId: string, query: PaginationQuery) {
    return this.walletRepo.getUserTransactions(userId, query);
  }
}
