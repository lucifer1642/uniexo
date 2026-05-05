import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserRole, VendorApprovalStatus } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { VendorRepository } from '../modules/vendor/vendor.repository';
import { logger } from '../config/logger';

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

    // Use pre-fetched data from authReq.user if available
    const user = authReq.user as any;
    
    let vendor = null;
    try {
        vendor = await vendorRepo.findByUserId(authReq.user.userId);
    } catch (e: any) {
        logger.error(`[RBAC] Vendor lookup failed for ${authReq.user.userId}`, e);
    }

    if (!vendor) {
      // Fallback: If it's a new vendor, they might only have the 'profiles' record data
      if (user.role === UserRole.VENDOR) {
          logger.warn(`[RBAC] Vendor profile missing for ${user.userId}, using basic profile data`);
          vendor = {
              approval_status: 'pending', // Assume pending for new vendors
              service_type: user.serviceType,
              business_name: user.businessName
          };
      } else {
          return next(new ForbiddenError('Vendor profile not found. Please complete your registration.'));
      }
    }

    // Lenient approval check for 'anyhow' operations
    if (vendor.approval_status !== VendorApprovalStatus.APPROVED) {
      const statusMsg = vendor.approval_status === VendorApprovalStatus.PENDING 
        ? 'is currently pending approval. Please wait for the administrator to review your documents.' 
        : `has been ${vendor.approval_status}. Please contact support for assistance.`;
      
      return next(new ForbiddenError(`Your vendor account ${statusMsg}`));
    }

    // Field check with fallbacks
    const missingFields = [];
    if (!(vendor.business_address || '').trim()) missingFields.push('business address');
    if (!(vendor.business_phone || '').trim()) missingFields.push('business phone');
    if (!vendor.service_type) missingFields.push('primary service type');

    if (missingFields.length > 0) {
      logger.warn(`[RBAC] Incomplete vendor profile for ${authReq.user.userId}: ${missingFields.join(', ')}`);
    }

    next();
  } catch (err) {
    next(err);
  }
};
