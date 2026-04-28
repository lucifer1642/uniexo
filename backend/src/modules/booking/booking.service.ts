import { BookingRepository } from './booking.repository';
import { Vehicle, House, AdminSettings, User, VendorProfile } from '../../database/models';
import { BookingStatus, ServiceType, ListingApprovalStatus } from '../../types/enums';
import { EmailService } from '../../services/email.service';
import mongoose from 'mongoose';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { PaginationQuery } from '../../types';
import { env } from '../../config/env';

export class BookingService {
  private bookingRepo: BookingRepository;

  constructor() {
    this.bookingRepo = new BookingRepository();
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
    const userDoc = await User.findById(userId);
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

    // Find the service and vendor
    let vendorId: string;
    let totalAmount: number;
    let serviceName: string = '';

    if (data.serviceType === ServiceType.VEHICLE) {
      const vehicle = await Vehicle.findById(data.serviceId);
      if (!vehicle || vehicle.approvalStatus !== ListingApprovalStatus.APPROVED || !vehicle.isAvailable) {
        throw new NotFoundError('Vehicle not available');
      }
      vendorId = vehicle.vendorId.toString();
      serviceName = vehicle.name;
      if (data.bookingType === 'hourly') {
        const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
        totalAmount = (vehicle.pricePerHour || Math.round(vehicle.pricePerDay / 24)) * Math.max(1, hours);
      } else {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = vehicle.pricePerDay * Math.max(1, days);
      }
    } else if (data.serviceType === ServiceType.HOUSE) {
      const house = await House.findById(data.serviceId);
      if (!house || house.approvalStatus !== ListingApprovalStatus.APPROVED || !house.isAvailable) {
        throw new NotFoundError('House not available');
      }
      vendorId = house.vendorId.toString();
      serviceName = house.title;

      let basePrice = 0;
      let monthlyRent = 0;
      let securityDeposit = 0;
      let totalMonths = data.totalMonths || 1;

      if (house.propertyType === 'pg') {
        // Find which sharing price to use (assuming single for now if not specified)
        monthlyRent = house.pricePerMonth || 0;
        securityDeposit = house.securityDeposit || 0;
        const electricity = house.electricityIncluded === false ? (house.electricityCharge || 0) : 0;
        
        // 1st month = rent + security + electricity
        totalAmount = monthlyRent + securityDeposit + electricity;
      } else {
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalAmount = (house.pricePerDay || 0) * Math.max(1, days);
      }
    } else {
      throw new BadRequestError('Invalid service type for booking');
    }

    if (vendorId === userId) {
      throw new BadRequestError('Cannot book your own listing');
    }

    // Check for conflicting bookings
    const conflicts = await this.bookingRepo.findConflicting(data.serviceId, startDate, endDate);
    if (conflicts.length > 0) {
      throw new BadRequestError('Selected dates are not available');
    }

    // Calculate commission
    const commissionSetting = await AdminSettings.findOne({ key: 'commission_percent' });
    const commissionPercent = commissionSetting
      ? (commissionSetting.value as number)
      : env.DEFAULT_COMMISSION_PERCENT;
    const commissionAmount = (totalAmount * commissionPercent) / 100;

    const booking = await this.bookingRepo.create({
      userId: userId as any,
      vendorId: vendorId as any,
      serviceType: data.serviceType,
      serviceId: data.serviceId as any,
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
      securityDeposit: house.propertyType === 'pg' ? house.securityDeposit : 0,
      monthlyRent: house.propertyType === 'pg' ? house.pricePerMonth : 0,
      installments: data.serviceType === ServiceType.HOUSE && house.propertyType === 'pg' && (data.totalMonths || 1) > 1 
        ? Array.from({ length: (data.totalMonths || 1) - 1 }).map((_, i) => ({
            month: i + 2,
            amount: house.pricePerMonth || 0,
            status: 'pending',
            dueDate: new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + i + 1)),
          }))
        : [],
    });

    try {
      const userDoc = await User.findById(userId);
      const vendorDoc = await User.findById(vendorId);
      if (userDoc && vendorDoc) {
        await EmailService.sendBookingCreatedNotification(
          userDoc.email,
          vendorDoc.email,
          {
            serviceName,
            serviceType: data.serviceType,
            bookingId: booking._id.toString(),
            amount: totalAmount,
            startDate: startDate.toLocaleDateString(),
            endDate: endDate.toLocaleDateString(),
            paymentMethod: data.paymentMethod || 'online',
          }
        );
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
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const bookingUserId = (booking.userId as any)._id ? (booking.userId as any)._id.toString() : booking.userId.toString();
    const bookingVendorId = (booking.vendorId as any)._id ? (booking.vendorId as any)._id.toString() : booking.vendorId.toString();

    // Validate permissions
    if (role === 'user' && bookingUserId !== userId) {
      throw new ForbiddenError('Not your booking');
    }
    if (role === 'vendor' && bookingVendorId !== userId) {
      throw new ForbiddenError('Not your booking');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
    };

    const currentStatus = booking.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new BadRequestError(`Cannot change status from ${currentStatus} to ${status}`);
    }

    if (status === BookingStatus.CONFIRMED && currentStatus === BookingStatus.PENDING) {
      const conflicts = await this.bookingRepo.findConflicting(
        booking.serviceId.toString(),
        booking.startDate,
        booking.endDate,
        bookingId
      );
      if (conflicts.length > 0) {
        throw new BadRequestError('These dates have already been confirmed for another booking.');
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (status === BookingStatus.CANCELLED && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }

    const updatedBooking = await this.bookingRepo.update(bookingId, updateData as any);

    if (status === BookingStatus.CONFIRMED && currentStatus === BookingStatus.PENDING) {
      // 1. Auto-cancel remaining pending bookings that overlap
      const BookingModel = mongoose.model('Booking');
      await BookingModel.updateMany(
        {
          serviceId: booking.serviceId,
          _id: { $ne: booking._id },
          status: BookingStatus.PENDING,
          $or: [
            { startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } },
          ],
        },
        { 
          $set: { 
            status: BookingStatus.CANCELLED, 
            cancellationReason: 'Dates were booked by another user' 
          } 
        }
      );

      // 2. Transmit the vendor's direct contact info via internal notification
      try {
        const MessageModel = mongoose.model('Message');
        const vendorProfile = await VendorProfile.findOne({ userId: booking.vendorId });
        
        const messageContent = `Your booking has been approved! You can contact the vendor directly:\nPhone: ${vendorProfile?.businessPhone || 'Not provided'}\nAddress: ${vendorProfile?.businessAddress || 'Not provided'}`;

        await MessageModel.create({
          senderId: booking.vendorId,
          receiverId: booking.userId,
          content: messageContent,
        });
      } catch (err) {
        console.error('Failed to send vendor contact info message', err);
      }

      // Send confirmation email for manual approvals (like Cash payments)
      try {
        const [userPopulated, vendorProfile] = await Promise.all([
          User.findById(booking.userId).select('name email'),
          VendorProfile.findOne({ userId: booking.vendorId }).populate('userId', 'name email'),
        ]);

        const vendorUser = vendorProfile?.userId as any;
        
        let serviceName = 'Service';
        if (booking.serviceType === ServiceType.VEHICLE) {
          const vehicle = await Vehicle.findById(booking.serviceId);
          serviceName = vehicle?.name || 'Vehicle Rental';
        } else if (booking.serviceType === ServiceType.HOUSE) {
          const house = await House.findById(booking.serviceId);
          serviceName = house?.title || 'House Rental';
        }

        if (userPopulated && vendorUser && vendorUser.email && vendorProfile) {
          await EmailService.sendBookingConfirmation(
            userPopulated.email,
            vendorUser.email,
            {
              serviceName,
              serviceType: booking.serviceType,
              bookingId: booking._id.toString(),
              amount: booking.totalAmount,
              startDate: booking.startDate.toISOString().split('T')[0],
              endDate: booking.endDate.toISOString().split('T')[0],
              vendorPhone: vendorProfile.businessPhone,
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send manual approval booking confirmation emails:', emailError);
      }
    }

    // If the booking is confirmed and it's a house, mark it as unavailable
    if (status === BookingStatus.CONFIRMED && booking.serviceType === 'house') {
      const HouseModel = mongoose.model('House');
      await HouseModel.findByIdAndUpdate(booking.serviceId, { isAvailable: false });
    }

    // If the booking is cancelled and it's a house, maybe make it available? (Assuming 1 concurrent booking)
    if (status === BookingStatus.CANCELLED && booking.serviceType === 'house' && currentStatus === BookingStatus.CONFIRMED) {
      const HouseModel = mongoose.model('House');
      await HouseModel.findByIdAndUpdate(booking.serviceId, { isAvailable: true });
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
