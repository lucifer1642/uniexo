import { Request, Response, NextFunction } from 'express';
import { WalletService } from './wallet.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const walletService = new WalletService();

export class WalletController {
  static async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const wallet = await walletService.getWallet(userId);
      ResponseFormatter.ok(res, 'Wallet fetched', wallet);
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const transactions = await walletService.getTransactions(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        sort: 'createdAt',
        order: 'desc',
      });
      ResponseFormatter.ok(res, 'Transactions fetched', transactions);
    } catch (error) {
      next(error);
    }
  }
}
