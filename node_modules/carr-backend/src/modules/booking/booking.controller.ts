import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const bookingService = new BookingService();

export class BookingController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const booking = await bookingService.createBooking(userId, req.body);
      ResponseFormatter.created(res, 'Booking created', booking);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.getById(req.params.id as string);
      ResponseFormatter.ok(res, 'Booking fetched', booking);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const booking = await bookingService.updateStatus(
        req.params.id as string,
        authReq.user!.userId,
        authReq.user!.role,
        req.body.status,
        req.body.cancellationReason,
      );
      ResponseFormatter.ok(res, 'Booking status updated', booking);
    } catch (error) {
      next(error);
    }
  }

  static async getUserBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const bookings = await bookingService.getUserBookings(
        userId,
        { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 },
        req.query.status as string,
      );
      ResponseFormatter.ok(res, 'User bookings fetched', bookings);
    } catch (error) {
      next(error);
    }
  }

  static async getVendorBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const bookings = await bookingService.getVendorBookings(
        userId,
        { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 },
        req.query.status as string,
      );
      ResponseFormatter.ok(res, 'Vendor bookings fetched', bookings);
    } catch (error) {
      next(error);
    }
  }

  static async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await bookingService.getAllBookings(
        { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 },
        req.query.status as string,
        req.query.serviceType as string,
      );
      ResponseFormatter.ok(res, 'All bookings fetched', bookings);
    } catch (error) {
      next(error);
    }
  }
}
