import { Review, IReview } from '../../database/models';

import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';

export class ReviewRepository {
  async create(data: Partial<IReview>): Promise<IReview> {
    return Review.create(data);
  }

  async findById(id: string): Promise<IReview | null> {
    return Review.findById(id).populate('userId', 'name avatar').exec();
  }

  async findByServiceId(serviceId: string, query: PaginationQuery) {
    return paginate(Review, { serviceId }, query, { path: 'userId', select: 'name avatar' });
  }

  async findByUser(userId: string, serviceId: string): Promise<IReview | null> {
    return Review.findOne({ userId, serviceId }).exec();
  }

  async softDelete(id: string): Promise<void> {
    await Review.findByIdAndUpdate(id, { isDeleted: true });
  }

  async getAverageRating(serviceId: string): Promise<{ avgRating: number; totalReviews: number }> {
    const [result] = await Review.aggregate([
      { $match: { serviceId, isDeleted: false } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    return result || { avgRating: 0, totalReviews: 0 };
  }
}
