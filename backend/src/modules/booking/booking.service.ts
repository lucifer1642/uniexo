import { BookingRepository } from './booking.repository';
import { VehicleRepository } from '../vehicle/vehicle.repository';
import { HouseRepository } from '../house/house.repository';
import { UserRepository } from '../user/user.repository';
import { VendorRepository } from '../vendor/vendor.repository';
import { supabase } from '../../config/supabase';
import { BookingStatus, ServiceType, ListingApprovalStatus } from '../../types/enums';
import { EmailService } from '../../services/email.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { PaginationQuery } from '../../types';
import { env } from '../../config/env';

async function getCommissionPercent(): Promise<number> {
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'commission_percent')
    .maybeSingle();
  const raw = data?.value as unknown;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (
    raw &&
    typeof raw === 'object' &&
    'value' in (raw as object) &&
    typeof (raw as { value?: unknown }).value === 'number'
  ) {
    return (raw as { value: number }).value;
  }
  return env.DEFAULT_COMMISSION_PERCENT;
}

export class BookingService {
  private bookingRepo: BookingRepository;
  private vehicleRepo: VehicleRepository;
  private houseRepo: HouseRepository;
  private userRepo: UserRepository;
  private vendorRepo: VendorRepository;

  constructor() {
    this.bookingRepo = new BookingRepository();
    this.vehicleRepo = new VehicleRepository();
    this.houseRepo = new HouseRepository();
    this.userRepo = new UserRepository();
    this.vendorRepo = new VendorRepository();
  }

  async createBooking(
    userId: string,
    data: {
      serviceType: ServiceType;
      serviceId: string;
      startDate: string;
      endDate: string;
      notes?: string;
      bookingType?: 'hourly' | 'daily';
      paymentMethod?: 'online';
      totalMonths?: number;
      idCardUrl?: string;
    },
  ) {
    const userDoc = await this.userRepo.findById(userId);
    if (!userDoc) {
      throw new NotFoundError('User not found');
    }

    if (!userDoc.name || !userDoc.phone) {
      throw new BadRequestError('Profile incomplete. Please update your name and phone before booking.');
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      throw new BadRequestError('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestError('Start date must be in the future');
    }

    let vendorId: string;
    let totalAmount: number;
    let serviceName: string = '';
    let house: any = null;

    if (data.serviceType === ServiceType.VEHICLE) {
      const vehicle = await this.vehicleRepo.findById(data.serviceId);
      if (!vehicle || vehicle.approval_status !== ListingApprovalStatus.APPROVED || vehicle.is_available === false) {
        throw new NotFoundError('Vehicle not available');
      }
      vendorId = String(vehicle.vendor_id);
      serviceName = vehicle.name;
      if (data.bookingType === 'hourly') {
        const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
        const pph = vehicle.price_per_hour || Math.round((vehicle.price_per_day || 0) / 24);
        totalAmount = pph * Math.max(1, hours);
      } else {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = (vehicle.price_per_day || 0) * Math.max(1, days);
      }
    } else if (data.serviceType === ServiceType.HOUSE) {
      house = await this.houseRepo.findById(data.serviceId);
      if (!house || house.approval_status !== ListingApprovalStatus.APPROVED || house.is_available === false) {
        throw new NotFoundError('House not available');
      }
      vendorId = String(house.vendor_id);
      serviceName = house.title;

      if (house.property_type === 'pg') {
        const monthlyRent = house.price_per_month || 0;
        const electricity = house.electricity_included === false ? house.electricity_charge || 0 : 0;
        totalAmount = monthlyRent + (house.security_deposit || 0) + electricity;
      } else {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = (house.price_per_day || 0) * Math.max(1, days);
      }
    } else {
      throw new BadRequestError('Invalid service type for booking');
    }

    if (vendorId === userId) {
      throw new BadRequestError('Cannot book your own listing');
    }

    const conflicts = await this.bookingRepo.findConflicting(
      data.serviceId,
      startDate.toISOString(),
      endDate.toISOString(),
    );
    if (conflicts.length > 0) {
      throw new BadRequestError('Selected dates are not available');
    }

    const commissionPercent = await getCommissionPercent();
    const commissionAmount = (totalAmount * commissionPercent) / 100;

    const booking = await this.bookingRepo.create({
      userId,
      vendorId,
      serviceType: data.serviceType,
      serviceId: data.serviceId,
      serviceSnapshot: house, // Sync all attributes as a snapshot
      bookingType: data.bookingType || 'daily',
      paymentMethod: data.paymentMethod || 'online',
      startDate,
      endDate,
      totalAmount,
      commissionAmount,
      commissionPercent,
      notes: data.notes,
      totalMonths: data.totalMonths,
      idCardUrl: data.idCardUrl,
      securityDeposit: house && (house.property_type === 'pg' || house.propertyType === 'pg') ? house.security_deposit || house.securityDeposit || 0 : 0,
      monthlyRent: house && (house.property_type === 'pg' || house.propertyType === 'pg') ? house.price_per_month || house.pricePerMonth || 0 : 0,
      installments:
        data.serviceType === ServiceType.HOUSE && house && (house.property_type === 'pg' || house.propertyType === 'pg') && (data.totalMonths || 1) > 1
          ? Array.from({ length: (data.totalMonths || 1) - 1 }).map((_, i) => ({
              month: i + 2,
              amount: house.price_per_month || house.pricePerMonth || 0,
              status: 'pending',
              dueDate: new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + i + 1)),
            }))
          : [],
    });

    try {
      const customer = await this.userRepo.findById(userId);
      const vendorUser = await this.userRepo.findById(vendorId);
      if (customer?.email && vendorUser?.email) {
        await EmailService.sendBookingCreatedNotification(customer.email, vendorUser.email, {
          serviceName,
          serviceType: data.serviceType,
          bookingId: booking.id,
          amount: totalAmount,
          startDate: startDate.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
          paymentMethod: data.paymentMethod || 'online',
        });
      }
    } catch (err) {
      console.error('Failed to send booking notification email', err);
    }

    return booking;
  }

  async getById(id: string) {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }

  async updateStatus(
    bookingId: string,
    userId: string,
    role: string,
    status: BookingStatus,
    cancellationReason?: string,
  ) {
    return this.commitStatusUpdate(bookingId, userId, role, status, cancellationReason);
  }

  private async commitStatusUpdate(
    bookingId: string,
    userId: string,
    role: string,
    status: BookingStatus,
    cancellationReason?: string,
  ) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const bookingUserId = String((booking as any).user_id);
    const bookingVendorId = String((booking as any).vendor_id);

    if (role === 'user' && bookingUserId !== userId) {
      throw new ForbiddenError('Not your booking');
    }
    if (role === 'vendor' && bookingVendorId !== userId) {
      throw new ForbiddenError('Not your booking');
    }

    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
    };

    const currentStatus = (booking as any).status as string;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new BadRequestError(`Cannot change status from ${currentStatus} to ${status}`);
    }

    if (status === BookingStatus.CONFIRMED && currentStatus === BookingStatus.PENDING) {
      const svcId = String((booking as any).service_id);
      const conflicts = await this.bookingRepo.findConflicting(
        svcId,
        new Date((booking as any).start_date).toISOString(),
        new Date((booking as any).end_date).toISOString(),
        bookingId,
      );
      if (conflicts.length > 0) {
        throw new BadRequestError('These dates have already been confirmed for another booking.');
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (status === BookingStatus.CANCELLED && cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }

    const updatedBooking = await this.bookingRepo.update(bookingId, updateData as any);

    if (status === BookingStatus.CONFIRMED && currentStatus === BookingStatus.PENDING) {
      await this.bookingRepo.cancelOverlappingPending(
        String((booking as any).service_id),
        new Date((booking as any).start_date).toISOString(),
        new Date((booking as any).end_date).toISOString(),
        bookingId,
        'Dates were booked by another user',
      );

      try {
        const vendorProfile = await this.vendorRepo.findByUserId(bookingVendorId);
        const msg =
          `Your booking has been approved! You can contact the vendor directly:\n` +
          `Phone: ${vendorProfile?.business_phone || 'Not provided'}\n` +
          `Address: ${vendorProfile?.business_address || 'Not provided'}`;

        await supabase.from('messages').insert({
          sender_id: bookingVendorId,
          receiver_id: bookingUserId,
          content: msg,
        });
      } catch (err) {
        console.error('Failed to send vendor contact info message', err);
      }

      try {
        const [cust, vendorProf, vendorAccount] = await Promise.all([
          this.userRepo.findById(bookingUserId),
          this.vendorRepo.findByUserId(bookingVendorId),
          this.userRepo.findById(bookingVendorId),
        ]);

        let serviceName = 'Service';
        const st = (booking as any).service_type;
        const sid = String((booking as any).service_id);
        if (st === ServiceType.VEHICLE) {
          const v = await this.vehicleRepo.findById(sid);
          serviceName = v?.name || 'Vehicle Rental';
        } else if (st === ServiceType.HOUSE) {
          const h = await this.houseRepo.findById(sid);
          serviceName = h?.title || 'House Rental';
        }

        const totalAmt = Number((booking as any).total_amount);
        if (cust?.email && vendorAccount?.email) {
          await EmailService.sendBookingConfirmation(cust.email, vendorAccount.email, {
            serviceName,
            serviceType: st as ServiceType,
            bookingId,
            amount: totalAmt,
            startDate: new Date((booking as any).start_date).toISOString().split('T')[0],
            endDate: new Date((booking as any).end_date).toISOString().split('T')[0],
            vendorPhone: vendorProf?.business_phone,
          });
        }
      } catch (emailError) {
        console.error('Failed to send manual approval booking confirmation emails:', emailError);
      }
    }

    if (status === BookingStatus.CONFIRMED && (booking as any).service_type === 'house') {
      await this.houseRepo.setListedAvailability(String((booking as any).service_id), false);
    }

    if (
      status === BookingStatus.CANCELLED &&
      (booking as any).service_type === 'house' &&
      currentStatus === BookingStatus.CONFIRMED
    ) {
      await this.houseRepo.setListedAvailability(String((booking as any).service_id), true);
    }

    return updatedBooking;
  }

  async getUserBookings(userId: string, query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return this.bookingRepo.findByUser(userId, query, filter);
  }

  async getVendorBookings(vendorId: string, query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return this.bookingRepo.findByVendor(vendorId, query, filter);
  }

  async getAllBookings(query: PaginationQuery, status?: string, serviceType?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;
    return this.bookingRepo.findAll(filter, query);
  }
}
