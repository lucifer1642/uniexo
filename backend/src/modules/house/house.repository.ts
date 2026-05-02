import { House, IHouse } from '../../database/models';

import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';
import { ListingApprovalStatus } from '../../types/enums';

export class HouseRepository {
  async create(data: Partial<IHouse>): Promise<IHouse> {
    return House.create(data);
  }

  async findById(id: string): Promise<IHouse | null> {
    return House.findById(id).populate('vendorId', 'name email phone').exec();
  }

  async update(id: string, data: Partial<IHouse>): Promise<IHouse | null> {
    return House.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async softDelete(id: string): Promise<void> {
    await House.findByIdAndUpdate(id, { isDeleted: true });
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    return paginate(House, filter, query, {
      populate: { path: 'vendorId', select: 'name email phone' },
      rankSortFallback: 'title',
    });
  }

  async findByVendor(vendorId: string, query: PaginationQuery) {
    return paginate(House, { vendorId }, query);
  }

  async updateApproval(id: string, status: ListingApprovalStatus, rejectionReason?: string): Promise<IHouse | null> {
    return House.findByIdAndUpdate(id, { approvalStatus: status, rejectionReason }, { new: true }).exec();
  }

  async addImages(id: string, images: string[]): Promise<IHouse | null> {
    return House.findByIdAndUpdate(id, { $push: { images: { $each: images } } }, { new: true }).exec();
  }
}
