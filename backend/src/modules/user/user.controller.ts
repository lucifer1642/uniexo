import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { ResponseFormatter } from '../../utils/response';
import { AuthRequest } from '../../types';
import { CloudinaryService } from '../../services/cloudinary.service';
import { BadRequestError } from '../../utils/errors';

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
  static async uploadIdCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      if (!req.file) {
        ResponseFormatter.badRequest(res, 'ID Card file is required');
        return;
      }
      const result = await userService.uploadIdCard(userId, req.file);
      ResponseFormatter.ok(res, 'ID Card uploaded', result);
    } catch (error) {
      next(error);
    }
  }

  static async submitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = (req as AuthRequest).user!;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files?.idProof) {
        throw new BadRequestError('Identity Proof is required');
      }

      const documents = [];
      
      // Upload ID Proof
      const idProofUrl = await CloudinaryService.uploadImage(files.idProof[0].buffer, 'kyc-docs');
      documents.push({ type: 'id_proof', url: idProofUrl });

      // Upload Business Proof if provided
      if (files.businessProof) {
        const businessProofUrl = await CloudinaryService.uploadImage(files.businessProof[0].buffer, 'kyc-docs');
        documents.push({ type: 'business_proof', url: businessProofUrl });
      }

      const bankDetails = JSON.parse(req.body.bankDetails || '{}');

      const kycRequest = await userService.submitKyc(userId, bankDetails, documents);
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
