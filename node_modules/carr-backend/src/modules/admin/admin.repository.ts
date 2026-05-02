import {
  User,
  VendorProfile,
  Vehicle,
  House,
  LaundryService,
  MarketplaceItem,
  Booking,
  Order,
  Payment,
  Transaction,
  AdminSettings,
} from '../../database/models';
import { BookingStatus, PaymentStatus, OrderStatus, VendorApprovalStatus } from '../../types/enums';

export class AdminRepository {
  async listUsers(page: number, limit: number, role?: string, search?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { isDeleted: false };
    if (role && role !== 'all') filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean(),
      User.countDocuments(filter),
    ]);
    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getDashboardStats() {
    const [
      totalUsers,
      totalVendors,
      pendingVendors,
      totalVehicles,
      totalHouses,
      totalBookings,
      totalOrders,
      totalPayments,
      totalMarketplaceItems,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      VendorProfile.countDocuments({ isDeleted: false }),
      VendorProfile.countDocuments({ approvalStatus: VendorApprovalStatus.PENDING, isDeleted: false }),
      Vehicle.countDocuments({ isDeleted: false }),
      House.countDocuments({ isDeleted: false }),
      Booking.countDocuments({ isDeleted: false }),
      Order.countDocuments({ isDeleted: false }),
      Payment.countDocuments(),
      MarketplaceItem.countDocuments({ isDeleted: false }),
    ]);

    const [revenueResult] = await Payment.aggregate([
      { $match: { status: PaymentStatus.CAPTURED } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);

    const [bookingStats] = await Booking.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const recentBookings = await Booking.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('vendorId', 'name email')
      .lean();

    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .lean();

    return {
      counts: {
        totalUsers,
        totalVendors,
        pendingVendors,
        totalVehicles,
        totalHouses,
        totalBookings,
        totalOrders,
        totalPayments,
        totalMarketplaceItems,
      },
      totalRevenue: revenueResult?.totalRevenue || 0,
      recentBookings,
      recentPayments,
    };
  }

  async suspendUser(userId: string, suspended: boolean) {
    return User.findByIdAndUpdate(userId, { isSuspended: suspended }, { new: true });
  }

  async getReportedItems(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      MarketplaceItem.find({ isReported: true, isDeleted: false })
        .sort({ reportCount: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sellerId', 'name email')
        .lean(),
      MarketplaceItem.countDocuments({ isReported: true, isDeleted: false }),
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getSettings() {
    return AdminSettings.find().lean();
  }

  async upsertSetting(key: string, value: unknown, description?: string) {
    return AdminSettings.findOneAndUpdate(
      { key },
      { value, description },
      { new: true, upsert: true },
    );
  }

  async getTransactions(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      Transaction.countDocuments(),
    ]);

    return {
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async removeReportedItem(itemId: string) {
    return MarketplaceItem.findByIdAndUpdate(
      itemId,
      { isDeleted: true },
      { new: true },
    );
  }

  // ==================== Rank Optimization ====================

  async getVendorsByCategory(category: 'ROOM' | 'CAR' | 'LAUNDRY') {
    const vendors = await VendorProfile.find({
      serviceType: category,
      isDeleted: false,
    })
      .populate('userId', 'name email phone')
      .sort({ rank: -1, businessName: 1 })
      .lean();
    return vendors;
  }

  async updateVendorRank(vendorProfileId: string, rank: number) {
    const profile = await VendorProfile.findByIdAndUpdate(
      vendorProfileId,
      { rank },
      { new: true },
    ).populate('userId', 'name email phone');

    if (!profile) return null;

    const vendorUserId = profile.userId && typeof profile.userId === 'object'
      ? (profile.userId as any)._id
      : profile.userId;

    // Propagate rank to all related listings
    if (profile.serviceType === 'ROOM') {
      await House.updateMany({ vendorId: vendorUserId }, { rank });
    } else if (profile.serviceType === 'CAR') {
      await Vehicle.updateMany({ vendorId: vendorUserId }, { rank });
    } else if (profile.serviceType === 'LAUNDRY') {
      await LaundryService.updateMany({ vendorId: vendorUserId }, { rank });
    }

    return profile;
  }
}
