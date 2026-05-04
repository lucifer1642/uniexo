import { Request, Response, NextFunction } from 'express';
import { OTPService } from '../../services/otp.service';
import { ResponseFormatter } from '../../utils/response';

export class AuthController {
  static async sendLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        ResponseFormatter.badRequest(res, 'Email is required');
        return;
      }
      await OTPService.generateAndSend(email, 'login-verify');
      ResponseFormatter.ok(res, 'OTP sent successfully');
    } catch (error) {
      next(error);
    }
  }

  static async verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        ResponseFormatter.badRequest(res, 'Email and OTP are required');
        return;
      }
      
      const { valid } = await OTPService.verify(email, otp, 'login-verify');
      if (!valid) {
        ResponseFormatter.badRequest(res, 'Invalid or expired OTP');
        return;
      }
      
      ResponseFormatter.ok(res, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }
}
