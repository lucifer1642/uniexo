import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const reviewService = new ReviewService();

export class ReviewController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const review = await reviewService.createReview(userId, req.body);
      ResponseFormatter.created(res, 'Review created', review);
    } catch (error) {
      next(error);
    }
  }

  static async getServiceReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = req.params.serviceId as string;
      const reviews = await reviewService.getServiceReviews(serviceId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        sort: 'createdAt',
        order: 'desc',
      });
      ResponseFormatter.ok(res, 'Reviews fetched', reviews);
    } catch (error) {
      next(error);
    }
  }

  static async getAverageRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = req.params.serviceId as string;
      const rating = await reviewService.getAverageRating(serviceId);
      ResponseFormatter.ok(res, 'Average rating fetched', rating);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      await reviewService.deleteReview(req.params.id as string, userId);
      ResponseFormatter.ok(res, 'Review deleted');
    } catch (error) {
      next(error);
    }
  }
}
