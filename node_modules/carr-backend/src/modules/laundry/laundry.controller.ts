import { Request, Response, NextFunction } from 'express';
import { LaundryServiceModule } from './laundry.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const laundryService = new LaundryServiceModule();

export class LaundryController {
  // Admin
  static async createService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await laundryService.createService(req.body);
      ResponseFormatter.created(res, 'Laundry service created', service);
    } catch (error) {
      next(error);
    }
  }

  static async updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await laundryService.updateService(req.params.id as string, req.body);
      ResponseFormatter.ok(res, 'Laundry service updated', service);
    } catch (error) {
      next(error);
    }
  }

  static async deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await laundryService.deleteService(req.params.id as string);
      ResponseFormatter.ok(res, 'Laundry service deleted');
    } catch (error) {
      next(error);
    }
  }

  // Public
  static async listServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services = await laundryService.listServices({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'Laundry services fetched', services);
    } catch (error) {
      next(error);
    }
  }

  static async getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await laundryService.getServiceById(req.params.id as string);
      ResponseFormatter.ok(res, 'Laundry service fetched', service);
    } catch (error) {
      next(error);
    }
  }

  // User
  static async placeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const order = await laundryService.placeOrder(userId, req.body);
      ResponseFormatter.created(res, 'Order placed successfully', order);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await laundryService.getOrderById(req.params.id as string);
      ResponseFormatter.ok(res, 'Order fetched', order);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const orders = await laundryService.getUserOrders(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'Orders fetched', orders);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await laundryService.updateOrderStatus(req.params.id as string, req.body.status);
      ResponseFormatter.ok(res, 'Order status updated', order);
    } catch (error) {
      next(error);
    }
  }

  static async listAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await laundryService.listAllOrders(
        { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 },
        req.query.status as string,
      );
      ResponseFormatter.ok(res, 'All orders fetched', orders);
    } catch (error) {
      next(error);
    }
  }

  // Vendor: Get own laundry service
  static async getMyService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const service = await laundryService.getVendorService(userId);
      ResponseFormatter.ok(res, 'Vendor laundry service fetched', service);
    } catch (error) {
      next(error);
    }
  }

  // Vendor: Update own laundry service toggles
  static async updateMyService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const service = await laundryService.updateVendorService(userId, req.body);
      ResponseFormatter.ok(res, 'Laundry service updated', service);
    } catch (error) {
      next(error);
    }
  }

  // Vendor: Get all orders for their laundry service
  static async getVendorOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const data = await laundryService.getVendorOrders(
        userId,
        { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 },
        req.query.status as string,
      );
      ResponseFormatter.ok(res, 'Vendor laundry orders fetched', data);
    } catch (error) {
      next(error);
    }
  }

  // Vendor: Update order status (pipeline)
  static async updateVendorOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const order = await laundryService.updateVendorOrderStatus(userId, req.params.id as string, req.body.status);
      ResponseFormatter.ok(res, 'Order status updated', order);
    } catch (error) {
      next(error);
    }
  }
}

