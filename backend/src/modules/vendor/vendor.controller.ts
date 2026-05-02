import { Request, Response, NextFunction } from 'express';
import { VendorService } from './vendor.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const vendorService = new VendorService();

export class VendorController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const profile = await vendorService.register(userId, req.body);
      ResponseFormatter.created(res, 'Vendor registration submitted for approval', profile);
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const profile = await vendorService.getProfile(userId);
      ResponseFormatter.ok(res, 'Vendor profile fetched', profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const profile = await vendorService.updateProfile(userId, req.body);
      ResponseFormatter.ok(res, 'Vendor profile updated', profile);
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        ResponseFormatter.badRequest(res, 'Documents are required');
        return;
      }
      const profile = await vendorService.uploadDocuments(userId, files);
      ResponseFormatter.ok(res, 'Documents uploaded', profile);
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.params.vendorId as string;
      const { status, reason } = req.body;
      const profile = await vendorService.approveVendor(vendorId, status, reason);
      ResponseFormatter.ok(res, `Vendor ${status}`, profile);
    } catch (error) {
      next(error);
    }
  }

  static async listVendors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sort, order, status } = req.query;
      const vendors = await vendorService.listVendors(
        {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          sort: sort as string,
          order: order as 'asc' | 'desc',
        },
        status as string,
      );
      ResponseFormatter.ok(res, 'Vendors fetched', vendors);
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const stats = await vendorService.getDashboardStats(userId);
      ResponseFormatter.ok(res, 'Vendor dashboard stats fetched', stats);
    } catch (error) {
      next(error);
    }
  }

  // ─── ANALYTICS CONTROLLERS ───────────────────────────────────────────

  static async getAnalyticsOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const data = await vendorService.getAnalyticsOverview(userId);
      ResponseFormatter.ok(res, 'Analytics overview fetched', data);
    } catch (error) {
      next(error);
    }
  }

  static async getSalesBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
      const data = await vendorService.getSalesBreakdown(userId, period);
      ResponseFormatter.ok(res, 'Sales breakdown fetched', data);
    } catch (error) {
      next(error);
    }
  }

  static async getLedgerBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const data = await vendorService.getLedgerBook(userId, page, limit);
      ResponseFormatter.ok(res, 'Ledger book fetched', data);
    } catch (error) {
      next(error);
    }
  }

  static async getDueAmounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const data = await vendorService.getDueAmounts(userId);
      ResponseFormatter.ok(res, 'Due amounts fetched', data);
    } catch (error) {
      next(error);
    }
  }

  static async getBookingTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const days = Number(req.query.days) || 30;
      const data = await vendorService.getBookingTrends(userId, days);
      ResponseFormatter.ok(res, 'Booking trends fetched', data);
    } catch (error) {
      next(error);
    }
  }

  static async getRevenueTimeSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const days = Number(req.query.days) || 30;
      const data = await vendorService.getRevenueTimeSeries(userId, days);
      ResponseFormatter.ok(res, 'Revenue time series fetched', data);
    } catch (error) {
      next(error);
    }
  }

  static async getRoomOccupancy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const data = await vendorService.getRoomOccupancy(userId);
      ResponseFormatter.ok(res, 'Room occupancy fetched', data);
    } catch (error) {
      next(error);
    }
  }
}
