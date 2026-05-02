import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserRole, VendorApprovalStatus } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { VendorProfile } from '../database/models/VendorProfile';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(authReq.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

export const isAdmin = authorize(UserRole.ADMIN);
export const isVendor = authorize(UserRole.VENDOR);
export const isUser = authorize(UserRole.USER);
export const isAdminOrVendor = authorize(UserRole.ADMIN, UserRole.VENDOR);
export const isAuthenticated = authorize(UserRole.ADMIN, UserRole.VENDOR, UserRole.USER);

export const isApprovedVendor = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (authReq.user.role === UserRole.ADMIN) {
      return next();
    }

    if (authReq.user.role !== UserRole.VENDOR) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    const vendor = await VendorProfile.findOne({ userId: authReq.user.userId });
    if (!vendor) {
      return next(new ForbiddenError('Vendor profile not found'));
    }

    if (vendor.approvalStatus !== VendorApprovalStatus.APPROVED) {
      return next(new ForbiddenError(`Vendor account is ${vendor.approvalStatus}. Approval required.`));
    }

    if (!vendor.businessAddress?.trim() || !vendor.businessPhone?.trim()) {
      return next(new ForbiddenError('Vendor profile is incomplete. Please update your business address and phone in your profile.'));
    }

    next();
  } catch (err) {
    next(err);
  }
};
