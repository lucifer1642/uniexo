import { Request, Response, NextFunction } from 'express';
import { VehicleService } from './vehicle.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const vehicleService = new VehicleService();

export class VehicleController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const files = req.files as Express.Multer.File[] | undefined;
      const vehicle = await vehicleService.create(userId, req.body, files);
      ResponseFormatter.created(res, 'Vehicle listing created', vehicle);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.getById(req.params.id as string);
      ResponseFormatter.ok(res, 'Vehicle fetched', vehicle);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const vehicle = await vehicleService.update(req.params.id as string, userId, req.body);
      ResponseFormatter.ok(res, 'Vehicle updated', vehicle);
    } catch (error) {
      next(error);
    }
  }

  static async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        ResponseFormatter.badRequest(res, 'Images are required');
        return;
      }
      const vehicle = await vehicleService.uploadImages(req.params.id as string, userId, files);
      ResponseFormatter.ok(res, 'Images uploaded', vehicle);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      await vehicleService.delete(req.params.id as string, userId);
      ResponseFormatter.ok(res, 'Vehicle deleted');
    } catch (error) {
      next(error);
    }
  }

  static async setAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const vehicle = await vehicleService.setAvailability(
        req.params.id as string,
        userId,
        req.body.availability,
      );
      ResponseFormatter.ok(res, 'Availability updated', vehicle);
    } catch (error) {
      next(error);
    }
  }

  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicles = await vehicleService.listPublic(req.query as any);
      ResponseFormatter.ok(res, 'Vehicles fetched', vehicles);
    } catch (error) {
      next(error);
    }
  }

  static async listByVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const vehicles = await vehicleService.listByVendor(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        sort: req.query.sort as string,
        order: req.query.order as 'asc' | 'desc',
      });
      ResponseFormatter.ok(res, 'Vendor vehicles fetched', vehicles);
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, rejectionReason } = req.body;
      const vehicle = await vehicleService.approveVehicle(req.params.id as string, status, rejectionReason);
      ResponseFormatter.ok(res, `Vehicle ${status}`, vehicle);
    } catch (error) {
      next(error);
    }
  }

  // ─── FLEET / DISPATCH ───────────────────────────────────────────────
  static async getFleet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const fleet = await vehicleService.getFleetStatus(userId);
      ResponseFormatter.ok(res, 'Fleet status fetched', fleet);
    } catch (error) {
      next(error);
    }
  }

  static async dispatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const vehicle = await vehicleService.dispatchVehicle(
        req.params.id as string,
        userId,
        req.body,
      );
      ResponseFormatter.ok(res, 'Vehicle dispatched', vehicle);
    } catch (error) {
      next(error);
    }
  }

  static async returnVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const vehicle = await vehicleService.returnVehicle(
        req.params.id as string,
        userId,
        req.body,
      );
      ResponseFormatter.ok(res, 'Vehicle returned and available', vehicle);
    } catch (error) {
      next(error);
    }
  }
}
