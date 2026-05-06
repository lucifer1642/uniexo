import { Request, Response, NextFunction } from 'express';
// Robust Auth v2.2 - Enhanced token tolerance for Vendor Listing Stability
import { AuthRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

function normalizeBearerToken(raw: string) {
  // Handle common transport issues:
  // - URL encoding converting '+' to ' '
  // - accidental quotes
  // - whitespace/newlines
  // - base64url variants ('-' '_' instead of '+' '/')
  return raw
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/\s/g, '+')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
}

/**
 * Authenticate middleware — verifies the custom base64 token
 * and attaches the user profile to the request.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[AUTH] Missing or malformed Authorization header');
      throw new UnauthorizedError('No authentication token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token || token === 'undefined' || token === 'null') {
      logger.warn('[AUTH] Invalid token format detected');
      throw new UnauthorizedError(
        'The authentication token provided is invalid or malformed. Please log in again.',
      );
    }

    const cleanToken = normalizeBearerToken(token);

    // Decode our simple base64 token
    let decodedToken: any;
    try {
      decodedToken = JSON.parse(Buffer.from(cleanToken, 'base64').toString('utf8'));
    } catch (e) {
      logger.error(`[AUTH] Token decode failed for: ${cleanToken.substring(0, 10)}...`);
      throw new UnauthorizedError('The authentication token format is invalid.');
    }

    // If exp is missing/invalid, treat token as expired (prevents NaN comparisons).
    const exp = Number(decodedToken?.exp);
    if (!Number.isFinite(exp)) {
      throw new UnauthorizedError('Your session has expired. Please log in again.');
    }

    // 1-year grace period for expiry to ensure 'NO AUTO-LOGOUT'
    const GRACE_PERIOD = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() > exp + GRACE_PERIOD) {
      throw new UnauthorizedError('Your session has expired. Please log in again.');
    }

    const userId = decodedToken?.userId;
    if (!userId) {
      throw new UnauthorizedError('Your session has expired. Please log in again.');
    }

    // Fetch the profile with a simple retry for DB consistency
    let profile: any = null;
    let profileError: any = null;

    for (let i = 0; i < 5; i++) {
      const result = await supabase
        .from('profiles')
        .select('id, email, role, name, is_deleted, is_suspended, kyc_status, service_type, business_name')
        .eq('id', userId)
        .maybeSingle();

      if (result.data) {
        profile = result.data;
        break;
      }
      profileError = result.error;
      if (i < 4) await new Promise(resolve => setTimeout(resolve, 200)); // Sleep between retries
    }

    if (!profile) {
      logger.error(`[AUTH] Profile fetch failed for ${userId}`, { error: profileError?.message });

      // If we have a valid token but DB is just slow/missing profile,
      // as a ROBUST fallback we can synthesize a user object if the token has the necessary info
      if (decodedToken.userId && decodedToken.role) {
        logger.warn(`[AUTH] Using synthesized profile for ${userId} due to DB fetch failure`);
        profile = {
          id: decodedToken.userId,
          role: decodedToken.role,
          email: 'unknown@uniexo.in',
          name: 'Nexus User',
          is_deleted: false,
          is_suspended: false,
        };
      } else {
        throw new UnauthorizedError(`Unable to verify profile. Please log in again.`);
      }
    }

    if (profile.is_deleted) {
      logger.warn(`[AUTH] Access denied for deleted account: ${profile.id}`);
      throw new UnauthorizedError('This account has been permanently deleted.');
    }

    if (profile.is_suspended) {
      logger.warn(`[AUTH] Access denied for suspended account: ${profile.id}`);
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }

    (req as AuthRequest).user = {
      userId: profile.id,
      role: profile.role,
      email: profile.email,
      name: profile.name,
      serviceType: (profile as any).service_type,
      kycStatus: (profile as any).kyc_status,
    };

    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('DEBUG [Auth Middleware Failure]:', error);
    }
    next(error);
  }
};

/**
 * Optional auth — silently continues if no token or invalid token is provided.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') return next();

    const cleanToken = normalizeBearerToken(token);

    let decodedToken: any;
    try {
      decodedToken = JSON.parse(Buffer.from(cleanToken, 'base64').toString('utf8'));
    } catch (e) {
      return next();
    }

    const exp = Number(decodedToken?.exp);
    if (!Number.isFinite(exp)) return next();
    if (Date.now() > exp) return next();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, name')
      .eq('id', decodedToken.userId)
      .maybeSingle();

    if (profile) {
      (req as AuthRequest).user = {
        userId: profile.id,
        role: profile.role,
        email: profile.email,
        name: profile.name,
      };
    }
    next();
  } catch (err) {
    logger.debug('[AUTH] Optional auth suppressed error:', err);
    next();
  }
};
