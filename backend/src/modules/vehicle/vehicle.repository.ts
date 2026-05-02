import { Vehicle, IVehicle } from '../../database/models';
import { PaginationQuery } from '../../types';
import { paginate } from '../../utils/pagination';
import { ListingApprovalStatus } from '../../types/enums';

export class VehicleRepository {
  async create(data: Partial<IVehicle>): Promise<IVehicle> {
    return Vehicle.create(data);
  }

  async findById(id: string): Promise<IVehicle | null> {
    return Vehicle.findOne({ _id: id, isDeleted: false }).populate('vendorId', 'name email phone').exec();
  }

  async update(id: string, data: Partial<IVehicle>): Promise<IVehicle | null> {
    return Vehicle.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async softDelete(id: string): Promise<void> {
    await Vehicle.findByIdAndUpdate(id, { isDeleted: true });
  }

  async findAll(filter: Record<string, unknown>, query: PaginationQuery) {
    return paginate(Vehicle, { ...filter, isDeleted: false }, query, {
      populate: { path: 'vendorId', select: 'name email phone' },
      rankSortFallback: 'name',
    });
  }

  async findByVendor(vendorId: string, query: PaginationQuery) {
    return paginate(
      Vehicle,
      { vendorId, isDeleted: false },
      query,
    );
  }

  async updateAvailability(
    id: string,
    availability: { startDate: Date; endDate: Date }[],
  ): Promise<IVehicle | null> {
    return Vehicle.findByIdAndUpdate(id, { availability }, { new: true }).exec();
  }

  async updateApproval(
    id: string,
    status: ListingApprovalStatus,
    rejectionReason?: string,
  ): Promise<IVehicle | null> {
    return Vehicle.findByIdAndUpdate(
      id,
      { approvalStatus: status, rejectionReason },
      { new: true },
    ).exec();
  }

  async addImages(id: string, images: string[]): Promise<IVehicle | null> {
    return Vehicle.findByIdAndUpdate(
      id,
      { $push: { images: { $each: images } } },
      { new: true },
    ).exec();
  }
}
