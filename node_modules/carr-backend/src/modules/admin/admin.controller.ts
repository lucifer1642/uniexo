import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ResponseFormatter } from '../../utils/response';

const adminService = new AdminService();

export class AdminController {
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await adminService.getDashboard();
      ResponseFormatter.ok(res, 'Dashboard fetched', dashboard);
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminService.listUsers(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20,
        req.query.role as string | undefined,
        req.query.search as string | undefined,
      );
      ResponseFormatter.ok(res, 'Users fetched', users);
    } catch (error) {
      next(error);
    }
  }

  static async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { suspended } = req.body;
      const user = await adminService.suspendUser(userId, suspended);
      ResponseFormatter.ok(res, `User ${suspended ? 'suspended' : 'unsuspended'}`, user);
    } catch (error) {
      next(error);
    }
  }

  static async getReportedItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await adminService.getReportedItems(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 10,
      );
      ResponseFormatter.ok(res, 'Reported items fetched', items);
    } catch (error) {
      next(error);
    }
  }

  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.getSettings();
      ResponseFormatter.ok(res, 'Settings fetched', settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key, value, description } = req.body;
      const setting = await adminService.updateSetting(key, value, description);
      ResponseFormatter.ok(res, 'Setting updated', setting);
    } catch (error) {
      next(error);
    }
  }

  static async setCommission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { percent } = req.body;
      const setting = await adminService.setCommission(percent);
      ResponseFormatter.ok(res, 'Commission updated', setting);
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactions = await adminService.getTransactions(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20,
      );
      ResponseFormatter.ok(res, 'Transactions fetched', transactions);
    } catch (error) {
      next(error);
    }
  }

  static async removeReportedItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const itemId = req.params.itemId as string;
      await adminService.removeReportedItem(itemId);
      ResponseFormatter.ok(res, 'Reported item removed');
    } catch (error) {
      next(error);
    }
  }
  static async backfillVendorProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.backfillVendorProfiles();
      ResponseFormatter.ok(res, `Backfill complete: ${result.created} created, ${result.skipped} already existed`, result);
    } catch (error) {
      next(error);
    }
  }

  static async listKycRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await adminService.listKycRequests();
      ResponseFormatter.ok(res, 'KYC requests fetched', requests);
    } catch (error) {
      next(error);
    }
  }

  static async processKycRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { kycId } = req.params;
      const { action, rejectionReason } = req.body;
      const result = await adminService.processKycRequest(kycId, action, rejectionReason);
      ResponseFormatter.ok(res, `KYC request ${action}d`, result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== Rank Optimization ====================

  static async getVendorsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.params.category as string;
      const vendors = await adminService.getVendorsByCategory(category.toUpperCase());
      ResponseFormatter.ok(res, 'Vendors fetched', vendors);
    } catch (error) {
      next(error);
    }
  }

  static async updateVendorRank(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vendorProfileId } = req.params;
      const { rank } = req.body;
      const result = await adminService.updateVendorRank(vendorProfileId, Number(rank));
      ResponseFormatter.ok(res, 'Vendor rank updated', result);
    } catch (error) {
      next(error);
    }
  }
}
