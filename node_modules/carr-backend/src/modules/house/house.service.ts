import { HouseRepository } from './house.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { VendorProfile, IHouse } from '../../database/models';
import { ListingApprovalStatus, VendorApprovalStatus } from '../../types/enums';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';


export class HouseService {
  private houseRepo: HouseRepository;

  constructor() {
    this.houseRepo = new HouseRepository();
  }

  async create(vendorId: string, data: Partial<IHouse>, files?: Express.Multer.File[]) {
    const vendor = await VendorProfile.findOne({ userId: vendorId });
    if (!vendor || vendor.approvalStatus !== VendorApprovalStatus.APPROVED) {
      throw new ForbiddenError('Vendor must be approved to create listings');
    }

    let images: string[] = [];
    if (files && files.length > 0) {
      images = await CloudinaryService.uploadMultiple(files, 'houses');
    }

    return this.houseRepo.create({
      ...data,
      vendorId: vendorId as any,
      images,
      approvalStatus: ListingApprovalStatus.APPROVED, // auto-approve from approved vendors
    });
  }

  async getById(id: string) {
    const house = await this.houseRepo.findById(id);
    if (!house) throw new NotFoundError('House not found');
    return house;
  }

  async update(houseId: string, vendorId: string, data: Partial<IHouse>) {
    const house = await this.houseRepo.findById(houseId);
    if (!house) throw new NotFoundError('House not found');
    if (house.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('You can only update your own listings');
    }
    return this.houseRepo.update(houseId, data);
  }

  async uploadImages(houseId: string, vendorId: string, files: Express.Multer.File[]) {
    const house = await this.houseRepo.findById(houseId);
    if (!house) throw new NotFoundError('House not found');
    if (house.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('You can only update your own listings');
    }

    const urls = await CloudinaryService.uploadMultiple(files, 'houses');
    return this.houseRepo.addImages(houseId, urls);
  }

  async delete(houseId: string, vendorId: string) {
    const house = await this.houseRepo.findById(houseId);
    if (!house) throw new NotFoundError('House not found');
    if (house.vendorId.toString() !== vendorId) {
      throw new ForbiddenError('You can only delete your own listings');
    }
    await this.houseRepo.softDelete(houseId);
  }

  async listPublic(query: {
    page?: number;
    limit?: number;
    city?: string;
    state?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const filter: Record<string, any> = {
      approvalStatus: ListingApprovalStatus.APPROVED,
      isAvailable: true,
    };

    if (query.city) filter.city = { $regex: query.city, $options: 'i' };
    if (query.state) filter.state = { $regex: query.state, $options: 'i' };
    if (query.propertyType) filter.propertyType = query.propertyType;
    if (query.bedrooms) filter.bedrooms = { $gte: query.bedrooms };
    if (query.minPrice || query.maxPrice) {
      const priceCondition: any = {};
      if (query.minPrice) priceCondition.$gte = query.minPrice;
      if (query.maxPrice) priceCondition.$lte = query.maxPrice;

      // If propertyType specifies 'pg', filter by pricePerMonth
      // If 'room', filter by pricePerDay
      // Otherwise, match either
      if (query.propertyType === 'pg') {
        filter.pricePerMonth = priceCondition;
      } else if (query.propertyType === 'room') {
        filter.pricePerDay = priceCondition;
      } else {
        filter.$or = [
          { pricePerMonth: priceCondition },
          { pricePerDay: priceCondition }
        ];
      }
    }

    return this.houseRepo.findAll(filter, {
      page: query.page,
      limit: query.limit,
      sort: query.sort || 'createdAt',
      order: query.order || 'desc',
    });
  }

  async listByVendor(vendorId: string, query: PaginationQuery) {
    return this.houseRepo.findByVendor(vendorId, query);
  }

  async approve(houseId: string, status: string, rejectionReason?: string) {
    const house = await this.houseRepo.findById(houseId);
    if (!house) throw new NotFoundError('House not found');

    const approvalStatus = status === 'approved'
      ? ListingApprovalStatus.APPROVED
      : ListingApprovalStatus.REJECTED;

    if (approvalStatus === ListingApprovalStatus.REJECTED && !rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }

    return this.houseRepo.updateApproval(houseId, approvalStatus, rejectionReason);
  }
}
