import { VehicleRepository } from './vehicle.repository';
import { BookingRepository } from '../booking/booking.repository';
import { VendorRepository } from '../vendor/vendor.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { ListingApprovalStatus, VendorApprovalStatus } from '../../types/enums';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';

import { IVehicle } from '../../types/models';

export class VehicleService {
  private vehicleRepo: VehicleRepository;
  private bookingRepo: BookingRepository;
  private vendorRepo: VendorRepository;

  constructor() {
    this.vehicleRepo = new VehicleRepository();
    this.bookingRepo = new BookingRepository();
    this.vendorRepo = new VendorRepository();
  }

  async create(
    vendorId: string,
    data: Partial<IVehicle> & { model?: string },
    files?: Express.Multer.File[],
  ) {
    const vendor = await this.vendorRepo.findByUserId(vendorId);
    if (!vendor || vendor.approval_status !== VendorApprovalStatus.APPROVED) {
      throw new ForbiddenError('Vendor must be approved to create listings');
    }

    let images: string[] = [];
    if (files && files.length > 0) {
      const allowedFiles = files.slice(0, 1);
      images = await CloudinaryService.uploadMultiple(allowedFiles, 'vehicles');
    }

    const { model, ...rest } = data as IVehicle & { model?: string };

    const vehicle = await this.vehicleRepo.create({
      ...(rest as object),
      modelName: model || (rest as { modelName?: string }).modelName,
      vendorId,
      images,
      approvalStatus: ListingApprovalStatus.APPROVED,
    });

    return vehicle;
  }

  async getById(id: string) {
    const vehicle = await this.vehicleRepo.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async update(vehicleId: string, vendorId: string, data: Partial<IVehicle>) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = String((vehicle as { vendor_id: string }).vendor_id);

    if (vId !== vendorId) {
      throw new ForbiddenError('You can only update your own vehicles');
    }

    return this.vehicleRepo.update(vehicleId, data);
  }

  async uploadImages(vehicleId: string, vendorId: string, files: Express.Multer.File[]) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = String((vehicle as { vendor_id: string }).vendor_id);

    if (vId !== vendorId) {
      throw new ForbiddenError('You can only update your own vehicles');
    }

    const urls = await CloudinaryService.uploadMultiple(files, 'vehicles');
    return this.vehicleRepo.addImages(vehicleId, urls);
  }

  async delete(vehicleId: string, vendorId: string) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = String((vehicle as { vendor_id: string }).vendor_id);

    if (vId !== vendorId) {
      throw new ForbiddenError(`You can only delete your own vehicles. Owner: ${vId}, Requester: ${vendorId}`);
    }

    await this.vehicleRepo.softDelete(vehicleId);
  }

  async setAvailability(
    vehicleId: string,
    vendorId: string,
    availability: { startDate: Date; endDate: Date }[],
  ) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = String((vehicle as { vendor_id: string }).vendor_id);

    if (vId !== vendorId) {
      throw new ForbiddenError('You can only update your own vehicles');
    }

    return this.vehicleRepo.updateAvailability(vehicleId, availability);
  }

  async listPublic(query: {
    page?: number;
    limit?: number;
    type?: string;
    brand?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const filter: Record<string, unknown> = {
      approvalStatus: ListingApprovalStatus.APPROVED,
      isAvailable: true,
    };

    if (query.type) filter.type = query.type;
    if (query.brand) filter.brand = query.brand;
    if (query.location) filter.location = query.location;
    if (query.minPrice) filter.minPrice = query.minPrice;
    if (query.maxPrice) filter.maxPrice = query.maxPrice;

    const paginationQuery: PaginationQuery = {
      page: query.page,
      limit: query.limit,
      sort: query.sort || 'createdAt',
      order: query.order || 'desc',
    };

    return this.vehicleRepo.findAll(filter as any, paginationQuery);
  }

  async listByVendor(vendorId: string, query: PaginationQuery) {
    return this.vehicleRepo.findByVendor(vendorId, query);
  }

  async approveVehicle(vehicleId: string, status: string, rejectionReason?: string) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const approvalStatus =
      status === 'approved' ? ListingApprovalStatus.APPROVED : ListingApprovalStatus.REJECTED;

    if (approvalStatus === ListingApprovalStatus.REJECTED && !rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }

    return this.vehicleRepo.updateApproval(vehicleId, approvalStatus, rejectionReason);
  }

  async getFleetStatus(vendorId: string) {
    const vehicles = await this.vehicleRepo.findByVendorForFleet(vendorId);

    return Promise.all(
      vehicles.map(async (v: Record<string, unknown>) => {
        let currentBooking: unknown = null;
        const cid = v.current_booking_id as string | undefined;
        if (cid) {
          currentBooking = await this.bookingRepo.findById(cid);
        }

        const expectedReturnAt = v.expected_return_at ? new Date(String(v.expected_return_at)) : null;
        const minutesLeft = expectedReturnAt
          ? Math.max(0, Math.round((expectedReturnAt.getTime() - Date.now()) / 60000))
          : null;

        return {
          ...v,
          currentBooking,
          minutesUntilReturn: minutesLeft,
          isOverdue:
            expectedReturnAt &&
            expectedReturnAt < new Date() &&
            v.current_status === 'dispatched',
        };
      }),
    );
  }

  async dispatchVehicle(
    vehicleId: string,
    vendorId: string,
    data: {
      dispatchedAt?: string;
      expectedReturnAt?: string;
      odometerOut?: number;
      dispatchNotes?: string;
      currentBookingId?: string;
    },
  ) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = String((vehicle as { vendor_id: string }).vendor_id);
    if (vId !== vendorId) throw new ForbiddenError('Not your vehicle');

    return this.vehicleRepo.patchById(vehicleId, {
      current_status: 'dispatched',
      is_available: false,
      dispatched_at: data.dispatchedAt ? data.dispatchedAt : new Date().toISOString(),
      expected_return_at: data.expectedReturnAt ?? null,
      odometer_out: data.odometerOut ?? null,
      dispatch_notes: data.dispatchNotes ?? null,
      current_booking_id: data.currentBookingId ?? null,
    });
  }

  async returnVehicle(
    vehicleId: string,
    vendorId: string,
    data: { odometerIn?: number; notes?: string },
  ) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = String((vehicle as { vendor_id: string }).vendor_id);
    if (vId !== vendorId) throw new ForbiddenError('Not your vehicle');

    return this.vehicleRepo.patchById(vehicleId, {
      current_status: 'available',
      is_available: true,
      odometer_in: data.odometerIn ?? null,
      dispatch_notes: data.notes ?? null,
      dispatched_at: null,
      expected_return_at: null,
      current_booking_id: null,
    });
  }
}
