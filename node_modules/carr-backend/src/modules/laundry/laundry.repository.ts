import { LaundryService, ILaundryService, Order, IOrder } from '../../database/models';

import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';

export class LaundryRepository {
  async createService(data: Partial<ILaundryService>): Promise<ILaundryService> {
    return LaundryService.create(data);
  }

  async findServiceById(id: string): Promise<ILaundryService | null> {
    return LaundryService.findById(id).exec();
  }

  async updateService(id: string, data: Partial<ILaundryService>): Promise<ILaundryService | null> {
    return LaundryService.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteService(id: string): Promise<void> {
    await LaundryService.findByIdAndUpdate(id, { isDeleted: true });
  }

  async findAllServices(filter: Record<string, any>, query: PaginationQuery) {
    return paginate(LaundryService, filter, query, {
      rankSortFallback: 'name',
    });
  }

  async createOrder(data: Partial<IOrder>): Promise<IOrder> {
    return Order.create(data);
  }

  async findOrderById(id: string): Promise<IOrder | null> {
    return Order.findById(id)
      .populate('userId', 'name email phone')
      .populate('laundryServiceId', 'name providerName')
      .exec();
  }

  async updateOrderStatus(id: string, status: string): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async findOrdersByUser(userId: string, query: PaginationQuery) {
    return paginate(Order, { userId }, query, [
      { path: 'laundryServiceId', select: 'name providerName' },
    ]);
  }

  async findAllOrders(filter: Record<string, any>, query: PaginationQuery) {
    return paginate(Order, filter, query, [
      { path: 'userId', select: 'name email' },
      { path: 'laundryServiceId', select: 'name providerName' },
    ]);
  }
}
