import mongoose from 'mongoose';
import { BookingModel } from '../booking/booking.model';
import { PaymentModel } from '../payment/payment.model';
import { UserModel } from '../user/user.model';
import { VehicleModel } from '../vehicle/vehicle.model';
import { HouseModel } from '../house/house.model';

export class AnalyticsService {
  /**
   * KPI Snapshot: The "Pulse" of the platform
   */
  async getKpiSnapshot() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalVendors,
      totalRevenue,
      todayRevenue,
      totalBookings,
      activeBookings
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: 'vendor' }),
      PaymentModel.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      PaymentModel.aggregate([
        { $match: { status: 'captured', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      BookingModel.countDocuments(),
      BookingModel.countDocuments({ status: 'confirmed' })
    ]);

    return {
      counts: {
        users: totalUsers,
        vendors: totalVendors,
        bookings: totalBookings,
        activeBookings
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0
      }
    };
  }

  /**
   * Revenue over time (Daily for last 30 days)
   */
  async getRevenueTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return PaymentModel.aggregate([
      { 
        $match: { 
          status: 'captured', 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
  }

  /**
   * Conversion Funnel: Search -> View -> Book -> Pay (Approximated)
   */
  async getConversionMetrics() {
    const [totalBookings, capturedPayments] = await Promise.all([
      BookingModel.countDocuments(),
      PaymentModel.countDocuments({ status: 'captured' })
    ]);

    return {
      bookingToPaymentRatio: totalBookings > 0 ? (capturedPayments / totalBookings) * 100 : 0,
      totalBookings,
      completedPayments: capturedPayments
    };
  }

  /**
   * Module Performance: Which service is making the most money?
   */
  async getModulePerformance() {
    return BookingModel.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: "$serviceType",
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
  }

  /**
   * KYC Velocity: Average time to approve/reject
   */
  async getKycVelocity() {
    // This assumes we have a processedAt field or similar. 
    // For now, let's just return counts of pending vs total.
    const [pending, approved, rejected] = await Promise.all([
      UserModel.countDocuments({ kycStatus: 'pending' }),
      UserModel.countDocuments({ kycStatus: 'approved' }),
      UserModel.countDocuments({ kycStatus: 'rejected' })
    ]);

    return { pending, approved, rejected };
  }
}
