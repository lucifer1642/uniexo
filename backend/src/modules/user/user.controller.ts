import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';

const userService = new UserService();

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const profile = await userService.getProfile(userId);
      ResponseFormatter.ok(res, 'Profile fetched', profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const updated = await userService.updateProfile(userId, req.body);
      ResponseFormatter.ok(res, 'Profile updated', updated);
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      if (!req.file) {
        ResponseFormatter.badRequest(res, 'Image file is required');
        return;
      }
      const result = await userService.uploadAvatar(userId, req.file);
      ResponseFormatter.ok(res, 'Avatar uploaded', result);
    } catch (error) {
      next(error);
    }
  }

      ResponseFormatter.ok(res, 'ID Card uploaded', result);
    } catch (error) {
      next(error);
    }
  }

  static async submitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const kycRequest = await userService.submitKyc(userId, req.body);
      ResponseFormatter.ok(res, 'KYC submitted for review', kycRequest);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(userId, currentPassword, newPassword);
      ResponseFormatter.ok(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      await userService.deleteAccount(userId);
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      ResponseFormatter.ok(res, 'Account deleted');
    } catch (error) {
      next(error);
    }
  }
}
