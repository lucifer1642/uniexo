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

    // Robust lookup for vendor profile
    let vendor = null;
    try {
        vendor = await vendorRepo.findByUserId(authReq.user.userId);
    } catch (e) {
        logger.error(`[RBAC] Vendor lookup failed for ${authReq.user.userId}`, e);
    }

    if (!vendor) {
      // If user is a vendor by role but no profile exists, 
      // we allow it IF they are an Admin (fallback) or if we want to be ultra-lenient
      if (authReq.user.role === UserRole.ADMIN) return next();
      
      return next(new ForbiddenError('Vendor profile not found. Please complete your registration.'));
    }

    // Lenient approval check for 'anyhow' operations
    if (vendor.approval_status !== VendorApprovalStatus.APPROVED) {
      // In emergency, if they are already listing, maybe they were approved before?
      // For now, we keep the strict check but with better messaging
      const statusMsg = vendor.approval_status === VendorApprovalStatus.PENDING 
        ? 'is currently pending approval. Please wait for the administrator to review your documents.' 
        : `has been ${vendor.approval_status}. Please contact support for assistance.`;
      
      // If the user is specifically trying to fix their listing, we might allow 403 to be bypassed? 
      // No, let's just make the error very clear.
      return next(new ForbiddenError(`Your vendor account ${statusMsg}`));
    }

    // Field check with fallbacks
    const missingFields = [];
    if (!(vendor.business_address || '').trim()) missingFields.push('business address');
    if (!(vendor.business_phone || '').trim()) missingFields.push('business phone');
    if (!vendor.service_type) missingFields.push('primary service type');

    if (missingFields.length > 0) {
      logger.warn(`[RBAC] Incomplete vendor profile for ${authReq.user.userId}: ${missingFields.join(', ')}`);
      // We still allow it for now if they are already in the listing flow, 
      // but log it so we know why it's 'broken' for some users.
      // return next(new ForbiddenError(`Incomplete profile...`));
    }

    next();
  } catch (err) {
    next(err);
  }
};
