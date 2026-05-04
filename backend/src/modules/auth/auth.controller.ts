import { Request, Response, NextFunction } from 'express';
import { OTPEngine } from '../../services/otp.service';
import { ResponseFormatter } from '../../utils/response';
import { logger } from '../../config/logger';

export class AuthController {
  /**
   * Send OTP for signup flow
   */
  static async sendSignupOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      logger.info(`[AUTH] Received Signup OTP request for ${email}`);
      if (!email) {
        ResponseFormatter.badRequest(res, 'Email is required');
        return;
      }
      const otp = await OTPEngine.send(email, 'signup');
      ResponseFormatter.ok(res, 'Verification code sent to your email', { fallbackOtp: otp });
    } catch (error) {
      logger.error('[AUTH] sendSignupOtp failed:', error);
      next(error);
    }
  }

  /**
   * Send OTP for login verification (admin/vendor 2FA)
   */
  static async sendLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      logger.info(`[AUTH] Received Login OTP request for ${email}`);
      if (!email) {
        ResponseFormatter.badRequest(res, 'Email is required');
        return;
      }
      const otp = await OTPEngine.send(email, 'login-verify');
      ResponseFormatter.ok(res, 'OTP sent successfully', { fallbackOtp: otp });
    } catch (error) {
      logger.error('[AUTH] sendLoginOtp failed:', error);
      next(error);
    }
  }

  /**
   * Unified OTP verification — accepts `purpose` from request body.
   * This is the primary endpoint for all OTP verification flows.
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, purpose } = req.body;
      const resolvedPurpose = purpose || 'login-verify';

      logger.info(`[AUTH] Verify OTP request for ${email} (purpose: ${resolvedPurpose})`);

      if (!email || !otp) {
        ResponseFormatter.badRequest(res, 'Email and OTP are required');
        return;
      }

      const { valid, userData } = await OTPEngine.verify(email, otp, resolvedPurpose);
      if (!valid) {
        ResponseFormatter.badRequest(res, 'Invalid or expired OTP');
        return;
      }

      ResponseFormatter.ok(res, 'OTP verified successfully', userData);
    } catch (error) {
      logger.error('[AUTH] verifyOtp failed:', error);
      next(error);
    }
  }

  /**
   * Legacy login OTP verify — delegates to unified verifyOtp with purpose 'login-verify'
   */
  static async verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Inject purpose for backward compatibility
    req.body.purpose = req.body.purpose || 'login-verify';
    return AuthController.verifyOtp(req, res, next);
  }

  /**
   * Resend OTP — generic endpoint for any purpose
   */
  static async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, purpose } = req.body;
      const resolvedPurpose = purpose || 'email-verify';

      logger.info(`[AUTH] Resend OTP request for ${email} (purpose: ${resolvedPurpose})`);

      if (!email) {
        ResponseFormatter.badRequest(res, 'Email is required');
        return;
      }

      const otp = await OTPEngine.send(email, resolvedPurpose);
      ResponseFormatter.ok(res, 'Verification code resent to your email', { fallbackOtp: otp });
    } catch (error) {
      logger.error('[AUTH] resendOtp failed:', error);
      next(error);
    }
  }
}
