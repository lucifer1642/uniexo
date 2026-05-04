import { Request, Response, NextFunction } from 'express';
import { OTPService } from '../../services/otp.service';
import { ResponseFormatter } from '../../utils/response';
import { logger } from '../../config/logger';

export class AuthController {
  static async sendLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      logger.info(`[AUTH] Received OTP request for ${email}`);
      if (!email) {
        ResponseFormatter.badRequest(res, 'Email is required');
        return;
      }
      await OTPService.generateAndSend(email, 'login-verify');
      ResponseFormatter.ok(res, 'OTP sent successfully');
    } catch (error) {
      logger.error('[AUTH] sendLoginOtp failed:', error);
      next(error);
    }
  }

  static async verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      logger.info(`[AUTH] Received verify OTP request for ${email}`);
      if (!email || !otp) {
        ResponseFormatter.badRequest(res, 'Email and OTP are required');
        return;
      }
      
      const { valid, userData } = await OTPService.verify(email, otp, 'login-verify');
      if (!valid) {
        ResponseFormatter.badRequest(res, 'Invalid or expired OTP');
        return;
      }
      
      ResponseFormatter.ok(res, 'OTP verified successfully', userData);
    } catch (error) {
      logger.error('[AUTH] verifyLoginOtp failed:', error);
      next(error);
    }
  }
}
