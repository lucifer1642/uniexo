import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserRole, VendorApprovalStatus } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { VendorRepository } from '../modules/vendor/vendor.repository';
import { supabase } from '../config/supabase';
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

    const userId = authReq.user.userId;
    
    let vendor = null;
    try {
        vendor = await vendorRepo.findByUserId(userId);
    } catch (e: any) {
        logger.error(`[RBAC] Vendor lookup failed for ${userId}`, e);
    }

    // Auto-create vendor_profiles row if missing for a vendor-role user
    if (!vendor) {
      logger.warn(`[RBAC] Vendor profile missing for ${userId}, attempting auto-creation...`);
      try {
        // Fetch the user's base profile to populate vendor_profiles
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('name, email, phone, business_name, service_type')
          .eq('id', userId)
          .maybeSingle();

        const businessName = userProfile?.business_name || userProfile?.name || authReq.user.name || 'My Business';
        const serviceType = userProfile?.service_type || authReq.user.serviceType || 'ROOM';
        const phone = userProfile?.phone || '';

        const { data: created, error: createErr } = await supabase
          .from('vendor_profiles')
          .upsert({
            user_id: userId,
            business_name: businessName,
            service_type: serviceType,
            business_phone: phone,
            business_address: '',
            approval_status: 'approved',
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (createErr) {
          logger.error(`[RBAC] Auto-create vendor_profiles failed for ${userId}:`, createErr);
        } else {
          logger.info(`[RBAC] Auto-created vendor_profiles for ${userId}: ${created.id}`);
          vendor = created;
        }
      } catch (autoCreateErr: any) {
        logger.error(`[RBAC] Auto-create vendor_profiles crashed for ${userId}:`, autoCreateErr);
      }
    }

    // If still no vendor after auto-create attempt, deny access
    if (!vendor) {
      return next(new ForbiddenError('Vendor profile could not be created. Please contact support.'));
    }

    // Approval check
    if (vendor.approval_status !== VendorApprovalStatus.APPROVED) {
      const statusMsg = vendor.approval_status === VendorApprovalStatus.PENDING 
        ? 'is currently pending approval. Our team is reviewing your documents.' 
        : `has been ${vendor.approval_status}. Please check your email or contact support for details.`;
      
      logger.warn(`[RBAC] Access denied for non-approved vendor ${userId}: ${vendor.approval_status}`);
      return next(new ForbiddenError(`Access Denied: Your vendor account ${statusMsg}`));
    }

    // Field check with fallbacks (warn only, don't block)
    const missingFields = [];
    if (!(vendor.business_address || '').trim()) missingFields.push('business address');
    if (!(vendor.business_phone || '').trim()) missingFields.push('business phone');
    if (!vendor.service_type) missingFields.push('primary service type');

    if (missingFields.length > 0) {
      logger.warn(`[RBAC] Incomplete vendor profile for ${userId}: ${missingFields.join(', ')}`);
    }

    next();
  } catch (err) {
    next(err);
  }
};
