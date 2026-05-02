import { ReviewRepository } from './review.repository';
import { ConflictError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { PaginationQuery } from '../../types';
import { ServiceType } from '../../types/enums';

export class ReviewService {
  private reviewRepo: ReviewRepository;

  constructor() {
    this.reviewRepo = new ReviewRepository();
  }

  async createReview(
    userId: string,
    data: {
      serviceType: ServiceType;
      serviceId: string;
      rating: number;
      comment: string;
    },
  ) {
    // Check if already reviewed
    const existing = await this.reviewRepo.findByUser(userId, data.serviceId);
    if (existing) {
      throw new ConflictError('You have already reviewed this service');
    }

    return this.reviewRepo.create({
      userId: userId as any,
      serviceType: data.serviceType,
      serviceId: data.serviceId as any,
      rating: data.rating,
      comment: data.comment,
    });
  }

  async getServiceReviews(serviceId: string, query: PaginationQuery) {
    return this.reviewRepo.findByServiceId(serviceId, query);
  }

  async getAverageRating(serviceId: string) {
    return this.reviewRepo.getAverageRating(serviceId);
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError('Review not found');
    if (review.userId.toString() !== userId) {
      throw new ForbiddenError('You can only delete your own reviews');
    }
    await this.reviewRepo.softDelete(reviewId);
  }
}
