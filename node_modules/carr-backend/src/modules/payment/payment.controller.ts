import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const paymentService = new PaymentService();

export class PaymentController {
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const result = await paymentService.createOrder(userId, req.body);
      ResponseFormatter.created(res, 'Payment order created', result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.verifyPayment(req.body);
      ResponseFormatter.ok(res, 'Payment verified successfully', payment);
    } catch (error) {
      next(error);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(req.body);
      await paymentService.handleWebhook(rawBody, signature);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.getPaymentById(req.params.id as string);
      ResponseFormatter.ok(res, 'Payment fetched', payment);
    } catch (error) {
      next(error);
    }
  }

  static async getUserPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const payments = await paymentService.getUserPayments(userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      ResponseFormatter.ok(res, 'Payments fetched', payments);
    } catch (error) {
      next(error);
    }
  }

  static async getAllPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await paymentService.getAllPayments(
        { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 },
        req.query.status as string,
      );
      ResponseFormatter.ok(res, 'All payments fetched', payments);
    } catch (error) {
      next(error);
    }
  }
}
