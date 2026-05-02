import { VendorProfile, IVendorProfile, User } from '../../database/models';
import { VendorApprovalStatus } from '../../types/enums';

import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';

export class VendorRepository {
  async create(data: Partial<IVendorProfile>): Promise<IVendorProfile> {
    return VendorProfile.create(data);
  }

  async findByUserId(userId: string): Promise<IVendorProfile | null> {
    return VendorProfile.findOne({ userId }).populate('userId', 'name email phone').exec();
  }

  async findById(id: string): Promise<IVendorProfile | null> {
    return VendorProfile.findById(id).populate('userId', 'name email phone').exec();
  }

  async updateProfile(userId: string, data: Partial<IVendorProfile>): Promise<IVendorProfile | null> {
    return VendorProfile.findOneAndUpdate({ userId }, data, { new: true }).exec();
  }

  async updateApproval(
    id: string,
    status: VendorApprovalStatus,
    rejectionReason?: string,
  ): Promise<IVendorProfile | null> {
    return VendorProfile.findByIdAndUpdate(
      id,
      { approvalStatus: status, rejectionReason },
      { new: true },
    ).exec();
  }

  async findAll(filter: Record<string, any>, query: PaginationQuery) {
    return paginate(VendorProfile, filter, query, { path: 'userId', select: 'name email phone' });
  }

  async updateDocuments(id: string, documents: string[]): Promise<IVendorProfile | null> {
    return VendorProfile.findByIdAndUpdate(
      id,
      { $push: { documents: { $each: documents } } },
      { new: true },
    ).exec();
  }
}
