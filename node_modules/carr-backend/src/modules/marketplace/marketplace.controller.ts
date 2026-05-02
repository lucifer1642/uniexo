import { Request, Response, NextFunction } from 'express';
import { MarketplaceService } from './marketplace.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const marketplaceService = new MarketplaceService();

export class MarketplaceController {
  static async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const files = req.files as Express.Multer.File[] | undefined;
      const item = await marketplaceService.createItem(userId, req.body, files);
      ResponseFormatter.created(res, 'Item listed', item);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await marketplaceService.getById(req.params.id as string);
      ResponseFormatter.ok(res, 'Item fetched', item);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const item = await marketplaceService.update(req.params.id as string, userId, req.body);
      ResponseFormatter.ok(res, 'Item updated', item);
    } catch (error) {
      next(error);
    }
  }

  static async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        ResponseFormatter.badRequest(res, 'Images are required');
        return;
      }
      const item = await marketplaceService.uploadImages(req.params.id as string, userId, files);
      ResponseFormatter.ok(res, 'Images uploaded', item);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      await marketplaceService.delete(req.params.id as string, userId);
      ResponseFormatter.ok(res, 'Item deleted');
    } catch (error) {
      next(error);
    }
  }

  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await marketplaceService.listPublic(req.query as any);
      ResponseFormatter.ok(res, 'Items fetched', items);
    } catch (error) {
      next(error);
    }
  }

  static async getUserItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const items = await marketplaceService.getUserItems(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'User items fetched', items);
    } catch (error) {
      next(error);
    }
  }

  static async reportItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await marketplaceService.reportItem(req.params.id as string, req.body.reason);
      ResponseFormatter.ok(res, 'Item reported');
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const message = await marketplaceService.sendMessage(userId, req.body);
      ResponseFormatter.created(res, 'Message sent', message);
    } catch (error) {
      next(error);
    }
  }

  static async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const otherUserId = req.params.otherUserId as string;
      const messages = await marketplaceService.getConversation(
        userId,
        otherUserId,
        req.query.itemId as string,
      );
      ResponseFormatter.ok(res, 'Conversation fetched', messages);
    } catch (error) {
      next(error);
    }
  }

  static async getUserConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const conversations = await marketplaceService.getUserConversations(userId);
      ResponseFormatter.ok(res, 'Conversations fetched', conversations);
    } catch (error) {
      next(error);
    }
  }

  // Offers
  static async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const offer = await marketplaceService.createOffer(userId, req.body);
      ResponseFormatter.created(res, 'Offer placed successfully', offer);
    } catch (error) {
      next(error);
    }
  }

  static async updateOfferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const offer = await marketplaceService.updateOfferStatus(req.params.id as string, userId, req.body.status);
      ResponseFormatter.ok(res, 'Offer status updated', offer);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOffersAsBuyer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const offers = await marketplaceService.getUserOffersAsBuyer(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'Your offers fetched', offers);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOffersAsSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const offers = await marketplaceService.getUserOffersAsSeller(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'Offers on your items fetched', offers);
    } catch (error) {
      next(error);
    }
  }

  static async getOffersForItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const offers = await marketplaceService.getOffersForItem(req.params.itemId as string, userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'Item offers fetched', offers);
    } catch (error) {
      next(error);
    }
  }
}
