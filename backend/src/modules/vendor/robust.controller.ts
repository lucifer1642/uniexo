import { Request, Response, NextFunction } from 'express';
import { HouseService } from '../house/house.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { LaundryServiceModule } from '../laundry/laundry.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';
import { logger } from '../../config/logger';

const houseService = new HouseService();
const vehicleService = new VehicleService();
const marketplaceService = new MarketplaceService();
const laundryService = new LaundryServiceModule();

/**
 * Robust Controller for Vendor Operations
 * Handles House, Vehicle, Laundry, and Marketplace with extreme fault tolerance.
 */
export class RobustVendorController {
  
  static async createHouse(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      logger.info(`[ROBUST-BACKEND] Creating House for user ${userId}`);
      
      const files = req.files as Express.Multer.File[] | undefined;
      // Pass raw body and files, repo handles mapping
      const house = await houseService.create(userId, req.body, files);
      
      ResponseFormatter.created(res, 'House listing created successfully (Robust Mode)', house);
    } catch (error) {
      logger.error('[ROBUST-BACKEND] House creation failed:', error);
      next(error);
    }
  }

  static async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      logger.info(`[ROBUST-BACKEND] Creating Vehicle for user ${userId}`);
      
      const files = req.files as Express.Multer.File[] | undefined;
      const vehicle = await vehicleService.create(userId, req.body, files);
      
      ResponseFormatter.created(res, 'Vehicle listing created successfully (Robust Mode)', vehicle);
    } catch (error) {
      logger.error('[ROBUST-BACKEND] Vehicle creation failed:', error);
      next(error);
    }
  }

  static async createMarketplaceItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      logger.info(`[ROBUST-BACKEND] Creating Marketplace Item for user ${userId}`);
      
      const files = req.files as Express.Multer.File[] | undefined;
      const item = await marketplaceService.createItem(userId, req.body, files);
      
      ResponseFormatter.created(res, 'Marketplace item created successfully (Robust Mode)', item);
    } catch (error) {
      logger.error('[ROBUST-BACKEND] Marketplace creation failed:', error);
      next(error);
    }
  }

  static async createLaundryService(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as AuthRequest).user!;
      logger.info(`[ROBUST-BACKEND] Creating Laundry Service for user ${userId}`);
      
      // Laundry might not use files yet, but we handle it just in case
      const laundry = await laundryService.createService({
        ...req.body,
        vendorId: userId
      });
      
      ResponseFormatter.created(res, 'Laundry service created successfully (Robust Mode)', laundry);
    } catch (error) {
      logger.error('[ROBUST-BACKEND] Laundry creation failed:', error);
      next(error);
    }
  }
}
