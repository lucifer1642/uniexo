import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserRole, VendorApprovalStatus } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { VendorRepository } from '../modules/vendor/vendor.repository';

const vendorRepo = new VendorRepository();

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
      return next(new UnauthorizedError('Authentication required. Please log in again.'));
    }

    if (authReq.user.role === UserRole.ADMIN) {
      return next();
    }

    if (authReq.user.role !== UserRole.VENDOR) {
      return next(new ForbiddenError('Only vendors are authorized to perform this action.'));
    }

    const vendor = await vendorRepo.findByUserId(authReq.user.userId);
    if (!vendor) {
      return next(new ForbiddenError('Vendor profile not found. Please complete your vendor registration.'));
    }

    if (vendor.approval_status !== VendorApprovalStatus.APPROVED) {
      const statusMsg = vendor.approval_status === VendorApprovalStatus.PENDING 
        ? 'is currently pending approval. Please wait for the administrator to review your documents.' 
        : `has been ${vendor.approval_status}. Please contact support for assistance.`;
      return next(new ForbiddenError(`Your vendor account ${statusMsg}`));
    }

    const missingFields = [];
    if (!vendor.business_address?.trim()) missingFields.push('business address');
    if (!vendor.business_phone?.trim()) missingFields.push('business phone');
    if (!vendor.service_type) missingFields.push('primary service type');

    if (missingFields.length > 0) {
      return next(new ForbiddenError(`Incomplete profile: please provide your ${missingFields.join(' and ')} in your profile settings before listing services.`));
    }

    next();
  } catch (err) {
    next(err);
  }
};
