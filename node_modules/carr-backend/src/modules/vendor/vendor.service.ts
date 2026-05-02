import { VendorRepository } from './vendor.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { User, Wallet, Vehicle, House, Booking, Order, LaundryService, Payment } from '../../database/models';
import { UserRole, VendorApprovalStatus, BookingStatus, OrderStatus } from '../../types/enums';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';
import mongoose from 'mongoose';

export class VendorService {
  private vendorRepo: VendorRepository;

  constructor() {
    this.vendorRepo = new VendorRepository();
  }

  async register(
    userId: string,
    data: {
      businessName: string;
      businessAddress: string;
      businessPhone: string;
      description?: string;
    },
  ) {
    const existing = await this.vendorRepo.findByUserId(userId);
    if (existing) {
      throw new ConflictError('Vendor profile already exists');
    }

    const profile = await this.vendorRepo.create({ ...data, userId: userId as any });

    // Update user role to vendor
    await User.findByIdAndUpdate(userId, { role: UserRole.VENDOR });

    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');
    return profile;
  }

  async updateProfile(userId: string, data: Partial<{
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    description: string;
    serviceType: string;
  }>) {
    const profile = await this.vendorRepo.updateProfile(userId, data);
    if (!profile) throw new NotFoundError('Vendor profile not found');
    return profile;
  }

  async uploadDocuments(userId: string, files: Express.Multer.File[]) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    const urls = await CloudinaryService.uploadMultiple(files, 'vendor-docs');
    return this.vendorRepo.updateDocuments(profile._id.toString(), urls);
  }

  async approveVendor(vendorProfileId: string, status: string, rejectionReason?: string) {
    const profile = await this.vendorRepo.findById(vendorProfileId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    if (profile.approvalStatus === VendorApprovalStatus.APPROVED && status === 'approved') {
      throw new BadRequestError('Vendor is already approved');
    }

    const approvalStatus =
      status === 'approved' ? VendorApprovalStatus.APPROVED : VendorApprovalStatus.REJECTED;

    if (approvalStatus === VendorApprovalStatus.REJECTED && !rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }

    const updated = await this.vendorRepo.updateApproval(
      vendorProfileId,
      approvalStatus,
      rejectionReason,
    );

    // Create wallet for approved vendor
    if (approvalStatus === VendorApprovalStatus.APPROVED) {
      const existingWallet = await Wallet.findOne({ userId: profile.userId });
      if (!existingWallet) {
        await Wallet.create({ userId: profile.userId });
      }
    }

    return updated;
  }

  async listVendors(query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.approvalStatus = status;
    return this.vendorRepo.findAll(filter, query);
  }

  async getDashboardStats(userId: string) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    const vendorBookings = await Booking.find({ vendorId: userId });

    const totalOrders = vendorBookings.length;
    const pendingOrders = vendorBookings.filter(b => b.status === 'pending').length;
    const completedOrders = vendorBookings.filter(b => b.status === 'completed').length;
    const revenue = vendorBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount - (b.commissionAmount || 0)), 0);

    const totalVehicles = await Vehicle.countDocuments({ vendorId: userId });
    const totalHouses = await House.countDocuments({ vendorId: userId });

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      revenue,
      traffic: 0,
      totalVehicles,
      totalHouses,
      status: profile.approvalStatus,
    };
  }

  // ─── ANALYTICS: OVERVIEW KPI ─────────────────────────────────────────
  async getAnalyticsOverview(userId: string) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    const allBookings = await Booking.find({ vendorId: userId });
    const confirmedBookings = allBookings.filter(b =>
      b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED
    );
    const completedBookings = allBookings.filter(b => b.status === BookingStatus.COMPLETED);
    const pendingBookings = allBookings.filter(b => b.status === BookingStatus.PENDING);
    const cancelledBookings = allBookings.filter(b => b.status === BookingStatus.CANCELLED);

    const totalRevenue = confirmedBookings.reduce((s, b) => s + b.totalAmount, 0);
    const totalCommission = confirmedBookings.reduce((s, b) => s + (b.commissionAmount || 0), 0);
    const netEarnings = totalRevenue - totalCommission;

    // Month-over-month revenue
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthRevenue = confirmedBookings
      .filter(b => new Date(b.createdAt) >= thisMonthStart)
      .reduce((s, b) => s + b.totalAmount, 0);
    const lastMonthRevenue = confirmedBookings
      .filter(b => new Date(b.createdAt) >= lastMonthStart && new Date(b.createdAt) <= lastMonthEnd)
      .reduce((s, b) => s + b.totalAmount, 0);

    const momGrowth = lastMonthRevenue === 0
      ? (thisMonthRevenue > 0 ? 100 : 0)
      : parseFloat((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));

    const conversionRate = allBookings.length === 0
      ? 0
      : parseFloat(((confirmedBookings.length / allBookings.length) * 100).toFixed(1));

    const avgBookingValue = confirmedBookings.length === 0
      ? 0
      : parseFloat((totalRevenue / confirmedBookings.length).toFixed(2));

    // Today's bookings
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const bookingsToday = allBookings.filter(b => new Date(b.createdAt) >= todayStart).length;

    // Laundry orders if vendor has laundry service
    const laundryService = await LaundryService.findOne({ vendorId: userId, isDeleted: false });
    let laundryRevenue = 0;
    let totalLaundryOrders = 0;
    if (laundryService) {
      const laundryOrders = await Order.find({ laundryServiceId: laundryService._id });
      totalLaundryOrders = laundryOrders.length;
      laundryRevenue = laundryOrders
        .filter(o => o.status !== OrderStatus.CANCELLED)
        .reduce((s, o) => s + (o.totalAmount - (o.commissionAmount || 0)), 0);
    }

    // Vehicles & Houses
    const totalVehicles = await Vehicle.countDocuments({ vendorId: userId, isDeleted: false });
    const totalHouses = await House.countDocuments({ vendorId: userId, isDeleted: false });
    const availableVehicles = await Vehicle.countDocuments({ vendorId: userId, currentStatus: 'available', isDeleted: false });
    const dispatchedVehicles = await Vehicle.countDocuments({ vendorId: userId, currentStatus: 'dispatched', isDeleted: false });

    return {
      totalRevenue,
      totalCommission,
      netEarnings: netEarnings + laundryRevenue,
      totalBookings: allBookings.length,
      confirmedBookings: confirmedBookings.length,
      completedBookings: completedBookings.length,
      pendingBookings: pendingBookings.length,
      cancelledBookings: cancelledBookings.length,
      conversionRate,
      avgBookingValue,
      momGrowth,
      bookingsToday,
      totalVehicles,
      totalHouses,
      availableVehicles,
      dispatchedVehicles,
      totalLaundryOrders,
      laundryRevenue,
      vendorStatus: profile.approvalStatus,
      serviceType: profile.serviceType,
    };
  }

  // ─── ANALYTICS: SALES BREAKDOWN ──────────────────────────────────────
  async getSalesBreakdown(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const bookings = await Booking.find({
      vendorId: userId,
      createdAt: { $gte: startDate },
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    });

    const vehicleRevenue = bookings
      .filter(b => b.serviceType === 'vehicle')
      .reduce((s, b) => s + b.totalAmount, 0);
    const houseRevenue = bookings
      .filter(b => b.serviceType === 'house')
      .reduce((s, b) => s + b.totalAmount, 0);

    const laundryService = await LaundryService.findOne({ vendorId: userId });
    let laundryRevenue = 0;
    if (laundryService) {
      const orders = await Order.find({
        laundryServiceId: laundryService._id,
        createdAt: { $gte: startDate },
        status: { $ne: OrderStatus.CANCELLED },
      });
      laundryRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    }

    // Monthly breakdown (last 6 months)
    const monthlySeries: { month: string; vehicle: number; house: number; laundry: number; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const mLabel = mStart.toLocaleString('default', { month: 'short', year: '2-digit' });

      const mBookings = await Booking.find({
        vendorId: userId,
        createdAt: { $gte: mStart, $lte: mEnd },
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      });

      const mVehicle = mBookings.filter(b => b.serviceType === 'vehicle').reduce((s, b) => s + b.totalAmount, 0);
      const mHouse = mBookings.filter(b => b.serviceType === 'house').reduce((s, b) => s + b.totalAmount, 0);
      let mLaundry = 0;
      if (laundryService) {
        const mOrders = await Order.find({ laundryServiceId: laundryService._id, createdAt: { $gte: mStart, $lte: mEnd }, status: { $ne: OrderStatus.CANCELLED } });
        mLaundry = mOrders.reduce((s, o) => s + o.totalAmount, 0);
      }
      monthlySeries.push({ month: mLabel, vehicle: mVehicle, house: mHouse, laundry: mLaundry, total: mVehicle + mHouse + mLaundry });
    }

    return {
      period,
      vehicleRevenue,
      houseRevenue,
      laundryRevenue,
      totalRevenue: vehicleRevenue + houseRevenue + laundryRevenue,
      vehicleBookings: bookings.filter(b => b.serviceType === 'vehicle').length,
      houseBookings: bookings.filter(b => b.serviceType === 'house').length,
      monthlySeries,
    };
  }

  // ─── ANALYTICS: LEDGER BOOK ───────────────────────────────────────────
  async getLedgerBook(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ vendorId: userId, isDeleted: false })
      .populate('userId', 'name email phone')
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments({ vendorId: userId, isDeleted: false });

    const entries = bookings.map((b: any) => {
      const customer = b.userId;
      const serviceLabel = b.serviceType === 'vehicle'
        ? (b.serviceId?.name || 'Vehicle')
        : b.serviceType === 'house'
        ? (b.serviceId?.title || 'Property')
        : 'Service';

      const paid = b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED;
      const net = b.totalAmount - (b.commissionAmount || 0);
      const due = b.status === BookingStatus.PENDING ? b.totalAmount : 0;

      // Installment dues
      const installmentDue = (b.installments || [])
        .filter((inst: any) => inst.status === 'pending')
        .reduce((s: number, inst: any) => s + inst.amount, 0);

      return {
        id: b._id,
        customerName: customer?.name || 'Unknown',
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || '',
        serviceType: b.serviceType,
        serviceName: serviceLabel,
        bookingDate: b.createdAt,
        startDate: b.startDate,
        endDate: b.endDate,
        totalAmount: b.totalAmount,
        commissionAmount: b.commissionAmount || 0,
        netEarned: paid ? net : 0,
        paymentStatus: b.status,
        dueAmount: due + installmentDue,
        installmentDue,
        colorCode: b.status === BookingStatus.COMPLETED
          ? 'green'
          : b.status === BookingStatus.CONFIRMED
          ? 'blue'
          : b.status === BookingStatus.PENDING
          ? 'amber'
          : 'red',
      };
    });

    // Totals
    const allBookings = await Booking.find({ vendorId: userId, isDeleted: false }).lean() as any[];
    const totalRevenue = allBookings
      .filter((b: any) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
      .reduce((s: number, b: any) => s + b.totalAmount, 0);
    const totalNetEarned = allBookings
      .filter((b: any) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
      .reduce((s: number, b: any) => s + (b.totalAmount - (b.commissionAmount || 0)), 0);
    const totalDue = allBookings
      .filter((b: any) => b.status === BookingStatus.PENDING)
      .reduce((s: number, b: any) => s + b.totalAmount, 0);
    const totalCommission = allBookings
      .filter((b: any) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
      .reduce((s: number, b: any) => s + (b.commissionAmount || 0), 0);

    return {
      entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      totals: { totalRevenue, totalNetEarned, totalDue, totalCommission },
    };
  }

  // ─── ANALYTICS: DUE AMOUNTS ──────────────────────────────────────────
  async getDueAmounts(userId: string) {
    const pendingBookings = await Booking.find({
      vendorId: userId,
      status: BookingStatus.PENDING,
      isDeleted: false,
    })
      .populate('userId', 'name email phone')
      .lean();

    // Overdue installments
    const confirmedBookings = await Booking.find({
      vendorId: userId,
      status: BookingStatus.CONFIRMED,
      isDeleted: false,
      'installments.status': 'pending',
    })
      .populate('userId', 'name email phone')
      .lean() as any[];

    const dues: any[] = [];

    for (const b of pendingBookings as any[]) {
      dues.push({
        bookingId: b._id,
        customerName: b.userId?.name || 'Unknown',
        customerEmail: b.userId?.email || '',
        customerPhone: b.userId?.phone || '',
        serviceType: b.serviceType,
        dueAmount: b.totalAmount,
        dueType: 'payment_pending',
        dueDate: b.createdAt,
        daysOverdue: Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      });
    }

    for (const b of confirmedBookings) {
      const overdueInstallments = (b.installments || []).filter(
        (inst: any) => inst.status === 'pending' && new Date(inst.dueDate) < new Date()
      );
      for (const inst of overdueInstallments) {
        dues.push({
          bookingId: b._id,
          customerName: b.userId?.name || 'Unknown',
          customerEmail: b.userId?.email || '',
          customerPhone: b.userId?.phone || '',
          serviceType: b.serviceType,
          dueAmount: inst.amount,
          dueType: 'installment_overdue',
          dueDate: inst.dueDate,
          month: inst.month,
          daysOverdue: Math.floor((Date.now() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
        });
      }
    }

    const totalDue = dues.reduce((s, d) => s + d.dueAmount, 0);
    return { dues, totalDue, count: dues.length };
  }

  // ─── ANALYTICS: BOOKING TRENDS (last N days) ─────────────────────────
  async getBookingTrends(userId: string, days = 30) {
    const result: { date: string; bookings: number; confirmed: number; cancelled: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);

      const dayBookings = await Booking.find({
        vendorId: userId,
        createdAt: { $gte: dayStart, $lte: dayEnd },
      }).lean() as any[];

      result.push({
        date: dayStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        bookings: dayBookings.length,
        confirmed: dayBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed').length,
        cancelled: dayBookings.filter((b: any) => b.status === 'cancelled').length,
      });
    }
    return result;
  }

  // ─── ANALYTICS: REVENUE TIME SERIES ──────────────────────────────────
  async getRevenueTimeSeries(userId: string, days = 30) {
    const result: { date: string; revenue: number; net: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);

      const dayBookings = await Booking.find({
        vendorId: userId,
        createdAt: { $gte: dayStart, $lte: dayEnd },
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      }).lean() as any[];

      const revenue = dayBookings.reduce((s: number, b: any) => s + b.totalAmount, 0);
      const net = dayBookings.reduce((s: number, b: any) => s + (b.totalAmount - (b.commissionAmount || 0)), 0);
      result.push({
        date: dayStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue,
        net,
      });
    }
    return result;
  }

  // ─── ANALYTICS: ROOM OCCUPANCY ────────────────────────────────────────
  async getRoomOccupancy(userId: string) {
    const houses = await House.find({ vendorId: userId, isDeleted: false }).lean() as any[];

    const result = await Promise.all(houses.map(async (h: any) => {
      const activeBookings = await Booking.find({
        serviceId: h._id,
        status: { $in: [BookingStatus.CONFIRMED] },
        isDeleted: false,
      }).populate('userId', 'name email phone').lean() as any[];

      const upcomingEnd = activeBookings.filter((b: any) => {
        const daysLeft = Math.floor((new Date(b.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft >= 0;
      });

      const pendingBookings = await Booking.find({
        serviceId: h._id,
        status: BookingStatus.PENDING,
        isDeleted: false,
      }).populate('userId', 'name email phone').lean();

      // Calculate occupancy (for PG: beds; for rooms: 1)
      const capacity = h.propertyType === 'pg' ? Math.max(h.bedrooms * 2, 1) : 1;
      const occupied = activeBookings.length;
      const occupancyPct = Math.min(Math.round((occupied / capacity) * 100), 100);

      return {
        houseId: h._id,
        title: h.title,
        propertyType: h.propertyType,
        city: h.city,
        bedrooms: h.bedrooms,
        pricePerMonth: h.pricePerMonth,
        pricePerDay: h.pricePerDay,
        isAvailable: h.isAvailable,
        capacity,
        occupied,
        occupancyPct,
        occupancyColor: occupancyPct >= 70 ? 'green' : occupancyPct >= 30 ? 'amber' : 'red',
        activeBookings: activeBookings.map((b: any) => ({
          id: b._id,
          customerName: b.userId?.name || 'Unknown',
          customerEmail: b.userId?.email || '',
          startDate: b.startDate,
          endDate: b.endDate,
          monthlyRent: b.monthlyRent || h.pricePerMonth,
          installments: b.installments || [],
        })),
        upcomingVacancies: upcomingEnd.length,
        pendingInterest: pendingBookings.length,
      };
    }));

    return result;
  }
}
