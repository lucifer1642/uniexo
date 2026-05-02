import { Request, Response, NextFunction } from 'express';
import { HouseService } from './house.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const houseService = new HouseService();

export class HouseController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const files = req.files as Express.Multer.File[] | undefined;
      const house = await houseService.create(userId, req.body, files);
      ResponseFormatter.created(res, 'House listing created', house);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const house = await houseService.getById(req.params.id as string);
      ResponseFormatter.ok(res, 'House fetched', house);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const house = await houseService.update(req.params.id as string, userId, req.body);
      ResponseFormatter.ok(res, 'House updated', house);
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
      const house = await houseService.uploadImages(req.params.id as string, userId, files);
      ResponseFormatter.ok(res, 'Images uploaded', house);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      await houseService.delete(req.params.id as string, userId);
      ResponseFormatter.ok(res, 'House deleted');
    } catch (error) {
      next(error);
    }
  }

  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const houses = await houseService.listPublic(req.query as any);
      ResponseFormatter.ok(res, 'Houses fetched', houses);
    } catch (error) {
      next(error);
    }
  }

  static async listByVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const houses = await houseService.listByVendor(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'Vendor houses fetched', houses);
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, rejectionReason } = req.body;
      const house = await houseService.approve(req.params.id as string, status, rejectionReason);
      ResponseFormatter.ok(res, `House ${status}`, house);
    } catch (error) {
      next(error);
    }
  }
}
