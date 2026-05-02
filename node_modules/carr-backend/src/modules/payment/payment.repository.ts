import { Payment, IPayment } from '../../database/models';

import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';

export class PaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return Payment.create(data);
  }

  async findById(id: string): Promise<IPayment | null> {
    return Payment.findById(id).populate('userId', 'name email').exec();
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<IPayment | null> {
    return Payment.findOne({ razorpayOrderId }).exec();
  }

  async update(id: string, data: Partial<IPayment>): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findByUser(userId: string, query: PaginationQuery) {
    return paginate(Payment, { userId }, query);
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    return paginate(Payment, filter, query, { path: 'userId', select: 'name email' });
  }
}
