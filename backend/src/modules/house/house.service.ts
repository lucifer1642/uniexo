import { HouseRepository } from './house.repository';
import { VendorRepository } from '../vendor/vendor.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { IHouse } from '../../types/models';
import { ListingApprovalStatus, VendorApprovalStatus } from '../../types/enums';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';


export class HouseService {
  private houseRepo: HouseRepository;
  private vendorRepo: VendorRepository;

  constructor() {
    this.houseRepo = new HouseRepository();
    this.vendorRepo = new VendorRepository();
  }

  async create(vendorId: string, data: Partial<IHouse>, files?: Express.Multer.File[]) {
    const vendor = await this.vendorRepo.findByUserId(vendorId);
    if (!vendor || vendor.approval_status !== VendorApprovalStatus.APPROVED) {
      throw new ForbiddenError('Vendor must be approved to create listings');
    }

    let images: string[] = [];
    if (files && files.length > 0) {
      try {
        images = await CloudinaryService.uploadMultiple(files, 'houses');
      } catch (err) {
        console.error('[HOUSE-SERVICE] Image upload failed, continuing with empty array:', err);
      }
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
    if (String((house as { vendor_id?: string }).vendor_id ?? house.vendorId) !== vendorId) {
      throw new ForbiddenError('You can only update your own listings');
    }
    return this.houseRepo.update(houseId, data);
  }

  async uploadImages(houseId: string, vendorId: string, files: Express.Multer.File[]) {
    const house = await this.houseRepo.findById(houseId);
    if (!house) throw new NotFoundError('House not found');
    if (String((house as { vendor_id?: string }).vendor_id ?? house.vendorId) !== vendorId) {
      throw new ForbiddenError('You can only update your own listings');
    }

    const urls = await CloudinaryService.uploadMultiple(files, 'houses');
    return this.houseRepo.addImages(houseId, urls);
  }

  async delete(houseId: string, vendorId: string) {
    const house = await this.houseRepo.findById(houseId);
    if (!house) throw new NotFoundError('House not found');
    if (String((house as { vendor_id?: string }).vendor_id ?? house.vendorId) !== vendorId) {
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
    const filter: Record<string, unknown> = {
      approvalStatus: ListingApprovalStatus.APPROVED,
      isAvailable: true,
    };

    if (query.city) filter.city = query.city;
    if (query.state) filter.state = query.state;
    if (query.propertyType) filter.propertyType = query.propertyType;
    if (query.bedrooms) filter.bedrooms = query.bedrooms;
    if (query.minPrice) filter.minPrice = query.minPrice;
    if (query.maxPrice) filter.maxPrice = query.maxPrice;

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
