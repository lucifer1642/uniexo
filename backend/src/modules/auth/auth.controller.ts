import { Request, Response, NextFunction } from 'express';
import { OTPEngine } from '../../services/otp.service';
import { ResponseFormatter } from '../../utils/response';
import { logger } from '../../config/logger';

export class AuthController {
  static async sendSignupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      logger.info(`[AUTH] Received Signup OTP request for ${email}`);
      if (!email) {
        ResponseFormatter.badRequest(res, 'Email is required');
        return;
      }
      await OTPEngine.send(email, 'signup');
      ResponseFormatter.ok(res, 'Verification code sent to your email');
    } catch (error) {
      logger.error('[AUTH] sendSignupOtp failed:', error);
      next(error);
    }
  }

  static async sendLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      logger.info(`[AUTH] Received OTP request for ${email}`);
      if (!email) {
        ResponseFormatter.badRequest(res, 'Email is required');
        return;
      }
      await OTPEngine.send(email, 'login-verify');
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
      
      const { valid, userData } = await OTPEngine.verify(email, otp, 'login-verify');
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
