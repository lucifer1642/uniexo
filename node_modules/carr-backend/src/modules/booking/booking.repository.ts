import { Booking, IBooking } from '../../database/models';

import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';

export class BookingRepository {
  async create(data: Partial<IBooking>): Promise<IBooking> {
    return Booking.create(data);
  }

  async findById(id: string): Promise<IBooking | null> {
    return Booking.findById(id)
      .populate('userId', 'name email phone')
      .populate('vendorId', 'name email phone')
      .exec();
  }

  async update(id: string, data: Partial<IBooking>): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findByUser(userId: string, query: PaginationQuery, filter: Record<string, any> = {}) {
    return paginate(Booking, { userId, ...filter }, query, [
      { path: 'vendorId', select: 'name email' },
      { path: 'serviceId', select: 'name title' },
    ]);
  }

  async findByVendor(vendorId: string, query: PaginationQuery, filter: Record<string, any> = {}) {
    return paginate(Booking, { vendorId, ...filter }, query, [
      { path: 'userId', select: 'name email phone' },
      { path: 'serviceId', select: 'name title' },
    ]);
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    return paginate(Booking, filter, query, [
      { path: 'userId', select: 'name email' },
      { path: 'vendorId', select: 'name email' },
    ]);
  }

  async findConflicting(
    serviceId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string,
  ): Promise<IBooking[]> {
    const filter: Record<string, any> = {
      serviceId,
      status: 'confirmed',
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    };
    if (excludeBookingId) filter._id = { $ne: excludeBookingId };
    return Booking.find(filter).exec();
  }
}
