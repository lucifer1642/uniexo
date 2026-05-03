import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { ResponseFormatter } from '../../utils/response';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  static async getKpiStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getKpiSnapshot();
      ResponseFormatter.ok(res, 'KPI stats fetched', stats);
    } catch (error) {
      next(error);
    }
  }

  static async getRevenueTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const trends = await analyticsService.getRevenueTrends();
      ResponseFormatter.ok(res, 'Revenue trends fetched', trends);
    } catch (error) {
      next(error);
    }
  }

  static async getModuleInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const insights = await analyticsService.getModulePerformance();
      ResponseFormatter.ok(res, 'Module insights fetched', insights);
    } catch (error) {
      next(error);
    }
  }

  static async getConversionFunnel(req: Request, res: Response, next: NextFunction) {
    try {
      const funnel = await analyticsService.getConversionMetrics();
      ResponseFormatter.ok(res, 'Conversion metrics fetched', funnel);
    } catch (error) {
      next(error);
    }
  }
}
