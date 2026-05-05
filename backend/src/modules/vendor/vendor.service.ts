import { VendorRepository } from './vendor.repository';
import { LaundryRepository } from '../laundry/laundry.repository';
import { HouseRepository } from '../house/house.repository';
import { UserRepository } from '../user/user.repository';
import { WalletRepository } from '../wallet/wallet.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { supabase } from '../../config/supabase';
import { UserRole, VendorApprovalStatus, BookingStatus, OrderStatus } from '../../types/enums';
import { ConflictError, NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { PaginationQuery } from '../../types';

export class VendorService {
  private vendorRepo: VendorRepository;
  private laundryRepo: LaundryRepository;
  private houseRepo: HouseRepository;
  private userRepo: UserRepository;
  private walletRepo: WalletRepository;

  constructor() {
    this.vendorRepo = new VendorRepository();
    this.laundryRepo = new LaundryRepository();
    this.houseRepo = new HouseRepository();
    this.userRepo = new UserRepository();
    this.walletRepo = new WalletRepository();
  }

  async verifyVendorApproved(userId: string): Promise<any> {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Vendor profile not found');
    }
    if (profile.approval_status !== VendorApprovalStatus.APPROVED) {
      throw new ForbiddenError('Your vendor account is not yet approved');
    }
    return profile;
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

    const profile = await this.vendorRepo.create({
      businessName: data.businessName,
      businessAddress: data.businessAddress,
      businessPhone: data.businessPhone,
      description: data.description,
      userId,
    });

    await this.userRepo.updateRole(userId, UserRole.VENDOR);

    return profile;
  }

  async getProfile(userId: string) {
    let profile = await this.vendorRepo.findByUserId(userId);
    
    // Auto-create vendor_profiles if it doesn't exist but public.profiles does
    if (!profile) {
      const userProfile = await this.userRepo.findById(userId);
      if (userProfile && userProfile.role === UserRole.VENDOR) {
         await this.vendorRepo.create({
            userId,
            businessName: userProfile.businessName || userProfile.name || 'My Business',
            businessAddress: userProfile.location || '',
            businessPhone: userProfile.phone || '',
            serviceType: userProfile.serviceType || 'ROOM',
            description: 'Auto-generated vendor profile'
         });
         profile = await this.vendorRepo.findByUserId(userId);
      } else {
         throw new NotFoundError('Vendor profile not found');
      }
    }
    
    return profile;
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      businessName: string;
      businessAddress: string;
      businessPhone: string;
      description: string;
      serviceType: string;
    }>,
  ) {
    const profile = await this.vendorRepo.updateProfile(userId, data);
    if (!profile) throw new NotFoundError('Vendor profile not found');
    return profile;
  }

  async uploadDocuments(userId: string, files: Express.Multer.File[]) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    const urls = await CloudinaryService.uploadMultiple(files, 'vendor-docs');
    return this.vendorRepo.updateDocuments(String(profile.id), urls);
  }

  async approveVendor(vendorProfileId: string, status: string, rejectionReason?: string) {
    const profile = await this.vendorRepo.findById(vendorProfileId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    if (profile.approval_status === VendorApprovalStatus.APPROVED && status === 'approved') {
      throw new BadRequestError('Vendor is already approved');
    }

    const approvalStatus =
      status === 'approved' ? VendorApprovalStatus.APPROVED : VendorApprovalStatus.REJECTED;

    if (approvalStatus === VendorApprovalStatus.REJECTED && !rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }

    const updated = await this.vendorRepo.updateApproval(vendorProfileId, approvalStatus, rejectionReason);

    if (approvalStatus === VendorApprovalStatus.APPROVED) {
      await this.walletRepo.getOrCreate(String(profile.user_id));
    }

    return updated;
  }

  async listVendors(query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.approvalStatus = status;
    return this.vendorRepo.findAll(filter, query);
  }

  async getDashboardStats(userId: string) {
    const kpis = await this.vendorRepo.getKPIs(userId);
    
    if (!kpis) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        revenue: 0,
        traffic: 0,
        totalVehicles: 0,
        totalHouses: 0,
        status: 'pending',
      };
    }

    return {
      totalOrders: kpis.total_bookings,
      pendingOrders: kpis.pending_bookings,
      completedOrders: kpis.completed_bookings,
      revenue: kpis.net_earnings,
      traffic: 0,
      totalVehicles: kpis.vehicle_count,
      totalHouses: kpis.house_count,
      status: kpis.approval_status,
    };
  }

  async getAnalyticsOverview(userId: string) {
    const kpis = await this.vendorRepo.getKPIs(userId);
    
    if (!kpis) {
      return {
        totalRevenue: 0,
        netEarnings: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        totalVehicles: 0,
        totalHouses: 0,
        vendorStatus: 'pending',
        momGrowth: 0,
        conversionRate: 0,
        avgBookingValue: 0,
        totalCommission: 0,
      };
    }

    return {
      totalRevenue: kpis.gross_revenue,
      netEarnings: kpis.net_earnings,
      totalBookings: kpis.total_bookings,
      confirmedBookings: kpis.confirmed_bookings,
      completedBookings: kpis.completed_bookings,
      pendingBookings: kpis.pending_bookings,
      totalVehicles: kpis.vehicle_count,
      totalHouses: kpis.house_count,
      vendorStatus: kpis.approval_status,
    };
  }

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

    const { data: bookingRows } = await supabase
      .from('bookings')
      .select('*')
      .eq('vendor_id', userId)
      .gte('created_at', startDate.toISOString())
      .in('status', [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]);

    const bookings = bookingRows ?? [];

    const vehicleRevenue = bookings
      .filter((b: { service_type: string }) => b.service_type === 'vehicle')
      .reduce((s: number, b: { total_amount: number }) => s + Number(b.total_amount ?? 0), 0);
    const houseRevenue = bookings
      .filter((b: { service_type: string }) => b.service_type === 'house')
      .reduce((s: number, b: { total_amount: number }) => s + Number(b.total_amount ?? 0), 0);

    const laundrySvc = await this.laundryRepo.findServicesByVendorUserId(userId);
    let laundryRevenue = 0;
    if (laundrySvc) {
      const { data: laundryOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('laundry_service_id', laundrySvc.id)
        .gte('created_at', startDate.toISOString())
        .neq('status', OrderStatus.CANCELLED);

      laundryRevenue =
        laundryOrders?.reduce((s: number, o: { total_amount?: number }) => s + Number(o.total_amount ?? 0), 0) ??
        0;
    }

    const monthlySeries: { month: string; vehicle: number; house: number; laundry: number; total: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const { data: mBookRows } = await supabase
        .from('bookings')
        .select('*')
        .eq('vendor_id', userId)
        .gte('created_at', mStart.toISOString())
        .lte('created_at', mEnd.toISOString())
        .in('status', [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]);

      const mBookings = mBookRows ?? [];

      const mVehicle = mBookings
        .filter((b: any) => b.service_type === 'vehicle')
        .reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);
      const mHouse = mBookings
        .filter((b: any) => b.service_type === 'house')
        .reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);

      let mLaundry = 0;
      if (laundrySvc) {
        const { data: mOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('laundry_service_id', laundrySvc.id)
          .gte('created_at', mStart.toISOString())
          .lte('created_at', mEnd.toISOString())
          .neq('status', OrderStatus.CANCELLED);

        mLaundry = mOrders?.reduce((s, o: any) => s + Number(o.total_amount ?? 0), 0) ?? 0;
      }

      const mLabel = mStart.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlySeries.push({
        month: mLabel,
        vehicle: mVehicle,
        house: mHouse,
        laundry: mLaundry,
        total: mVehicle + mHouse + mLaundry,
      });
    }

    return {
      period,
      vehicleRevenue,
      houseRevenue,
      laundryRevenue,
      totalRevenue: vehicleRevenue + houseRevenue + laundryRevenue,
      vehicleBookings: bookings.filter((b: any) => b.service_type === 'vehicle').length,
      houseBookings: bookings.filter((b: any) => b.service_type === 'house').length,
      monthlySeries,
    };
  }

  async getLedgerBook(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const { data: bookings, count: total } = await supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email, phone)', { count: 'exact' })
      .eq('vendor_id', userId)
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    const entries =
      bookings?.map((b: any) => {
        const customer = b.profiles || {};
        const paid = b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED;
        const ta = Number(b.total_amount ?? 0);
        const ca = Number(b.commission_amount ?? 0);
        const net = ta - ca;

        const installmentDue =
          Array.isArray(b.installments)
            ? b.installments.filter((inst: any) => inst.status === 'pending').reduce((s: number, inst: any) => s + Number(inst.amount ?? 0), 0)
            : 0;

        return {
          id: b.id,
          customerName: customer?.name ?? 'Unknown',
          customerEmail: customer?.email ?? '',
          customerPhone: customer?.phone ?? '',
          serviceType: b.service_type,
          serviceName: '(see listing)',
          bookingDate: b.created_at,
          startDate: b.start_date,
          endDate: b.end_date,
          totalAmount: ta,
          commissionAmount: ca,
          netEarned: paid ? net : 0,
          paymentStatus: b.status,
          dueAmount: b.status === BookingStatus.PENDING ? ta + installmentDue : installmentDue,
          installmentDue,
          colorCode:
            b.status === BookingStatus.COMPLETED
              ? 'green'
              : b.status === BookingStatus.CONFIRMED
                ? 'blue'
                : b.status === BookingStatus.PENDING
                  ? 'amber'
                  : 'red',
        };
      }) ?? [];

    const { data: allRows } = await supabase.from('bookings').select('*').eq('vendor_id', userId);

    const allBookings = allRows ?? [];
    const totalRevenue = allBookings
      .filter((b: any) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
      .reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);
    const totalNetEarned = allBookings
      .filter((b: any) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
      .reduce((s: number, b: any) => s + (Number(b.total_amount ?? 0) - Number(b.commission_amount ?? 0)), 0);
    const totalDue = allBookings.filter((b: any) => b.status === BookingStatus.PENDING).reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);

    const totalCommission = allBookings
      .filter((b: any) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
      .reduce((s: number, b: any) => s + Number(b.commission_amount ?? 0), 0);

    return {
      entries,
      pagination: { page, limit, total: total ?? 0, pages: Math.ceil((total ?? 0) / limit) },
      totals: { totalRevenue, totalNetEarned, totalDue, totalCommission },
    };
  }

  async getDueAmounts(userId: string) {
    const { data: pendingBookings } = await supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email, phone)')
      .eq('vendor_id', userId)
      .eq('status', BookingStatus.PENDING);

    const { data: confirmedRows } = await supabase
      .from('bookings')
      .select('*, profiles:user_id(name, email, phone)')
      .eq('vendor_id', userId)
      .eq('status', BookingStatus.CONFIRMED);

    const dues: Record<string, unknown>[] = [];

    for (const b of pendingBookings ?? []) {
      const pb = b as Record<string, any>;
      const customer = pb.profiles ?? {};
      dues.push({
        bookingId: pb.id,
        customerName: customer.name ?? 'Unknown',
        customerEmail: customer.email ?? '',
        customerPhone: customer.phone ?? '',
        serviceType: pb.service_type,
        dueAmount: Number(pb.total_amount ?? 0),
        dueType: 'payment_pending',
        dueDate: pb.created_at,
        daysOverdue: Math.floor((Date.now() - new Date(pb.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      });
    }

    for (const b of confirmedRows ?? []) {
      const cb = b as Record<string, any>;
      const customer = cb.profiles ?? {};
      const overdueInstallments =
        Array.isArray(cb.installments)
          ? cb.installments.filter(
              (inst: any) =>
                inst.status === 'pending' &&
                inst.dueDate &&
                new Date(inst.dueDate) < new Date(),
            )
          : [];

      for (const inst of overdueInstallments) {
        dues.push({
          bookingId: cb.id,
          customerName: customer.name ?? 'Unknown',
          customerEmail: customer.email ?? '',
          customerPhone: customer.phone ?? '',
          serviceType: cb.service_type,
          dueAmount: inst.amount,
          dueType: 'installment_overdue',
          dueDate: inst.dueDate,
          month: inst.month,
          daysOverdue: Math.floor(
            (Date.now() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24),
          ),
        });
      }
    }

    const totalDue = dues.reduce((s, d) => s + Number(d.dueAmount ?? 0), 0);
    return { dues, totalDue, count: dues.length };
  }

  async getBookingTrends(userId: string, days = 30) {
    const result: { date: string; bookings: number; confirmed: number; cancelled: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);

      const { data } = await supabase
        .from('bookings')
        .select('status')
        .eq('vendor_id', userId)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      const rows = data ?? [];

      result.push({
        date: dayStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        bookings: rows.length,
        confirmed: rows.filter((b: any) => b.status === 'confirmed' || b.status === 'completed').length,
        cancelled: rows.filter((b: any) => b.status === 'cancelled').length,
      });
    }
    return result;
  }

  async getRevenueTimeSeries(userId: string, days = 30) {
    const result: { date: string; revenue: number; net: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('vendor_id', userId)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
        .in('status', [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]);

      const dayBookings = data ?? [];

      const revenue = dayBookings.reduce((s: number, b: any) => s + Number(b.total_amount ?? 0), 0);
      const net = dayBookings.reduce(
        (s: number, b: any) =>
          s + (Number(b.total_amount ?? 0) - Number(b.commission_amount ?? 0)),
        0,
      );

      result.push({
        date: dayStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue,
        net,
      });
    }

    return result;
  }

  async getRoomOccupancy(userId: string) {
    const { data: houses } = await supabase
      .from('houses')
      .select('*')
      .eq('vendor_id', userId)
      .eq('is_deleted', false);

    const result = [];

    for (const h of houses ?? []) {
      const house = h as Record<string, any>;

      const { data: activeBookingsData } = await supabase
        .from('bookings')
        .select('*, profiles:user_id(name, email, phone)')
        .eq('service_id', house.id)
        .eq('status', BookingStatus.CONFIRMED);

      const activeBookings = activeBookingsData ?? [];

      const upcomingEnd = activeBookings.filter((b: any) => {
        const daysLeft =
          Math.floor((new Date(b.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft >= 0;
      });

      const { data: pend } = await supabase
        .from('bookings')
        .select('*, profiles:user_id(name, email, phone)')
        .eq('service_id', house.id)
        .eq('status', BookingStatus.PENDING);

      const pendingBookings = pend ?? [];

      const capacity =
        house.property_type === 'pg' ? Math.max(Number(house.bedrooms ?? 1) * 2, 1) : 1;
      const occupied = activeBookings.length;
      const occupancyPct = Math.min(Math.round((occupied / capacity) * 100), 100);

      result.push({
        houseId: house.id,
        title: house.title,
        propertyType: house.property_type,
        city: house.city,
        bedrooms: house.bedrooms,
        pricePerMonth: house.price_per_month,
        pricePerDay: house.price_per_day,
        isAvailable: house.is_available,
        capacity,
        occupied,
        occupancyPct,
        occupancyColor:
          occupancyPct >= 70 ? 'green' : occupancyPct >= 30 ? 'amber' : 'red',
        activeBookings: activeBookings.map((b: any) => ({
          id: b.id,
          customerName: b.profiles?.name ?? 'Unknown',
          customerEmail: b.profiles?.email ?? '',
          startDate: b.start_date,
          endDate: b.end_date,
          monthlyRent: b.monthly_rent ?? house.price_per_month,
          installments: b.installments ?? [],
        })),
        upcomingVacancies: upcomingEnd.length,
        pendingInterest: pendingBookings.length,
      });
    }

    return result;
  }
}
