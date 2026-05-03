import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';
import { env } from '../../config/env';

const authService = new AuthService();

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, phone, password, role, businessName, serviceType, universityId, location } = req.body;
      await authService.initiateSignup({ name, email, phone, password, role, businessName, serviceType, universityId, location });
      ResponseFormatter.ok(res, 'OTP sent to your email for verification');
    } catch (error) {
      next(error);
    }
  }

  static async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, purpose } = req.body;

      if (purpose === 'signup') {
        const result = await authService.verifySignupOTP(email, otp);

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });

        ResponseFormatter.created(res, 'Account created successfully', {
          accessToken: result.accessToken,
          user: result.user,
        });
        return;
      }

      // For other purposes (email-verify), just verify
      ResponseFormatter.ok(res, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      ResponseFormatter.ok(res, 'Login successful', {
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        ResponseFormatter.unauthorized(res, 'Refresh token not found');
        return;
      }

      const tokens = await authService.refreshTokens(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      ResponseFormatter.ok(res, 'Tokens refreshed', {
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const token = req.headers.authorization?.split(' ')[1] || '';
      await authService.logout(authReq.user?.userId || '', token);

      res.clearCookie('refreshToken', { path: '/' });
      ResponseFormatter.ok(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      ResponseFormatter.ok(res, 'If the email exists, a password reset OTP has been sent');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      await authService.resetPassword(email, otp, newPassword);
      ResponseFormatter.ok(res, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }

  static async resendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, purpose } = req.body;
      await authService.resendOTP(email, purpose);
      ResponseFormatter.ok(res, 'OTP resent successfully');
    } catch (error) {
      next(error);
    }
  }
}
