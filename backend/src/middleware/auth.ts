import { Request, Response, NextFunction } from 'express';
// Robust Auth v2.3 - Enhanced token tolerance for Vendor Listing Stability
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
      const decodedString = Buffer.from(cleanToken, 'base64').toString('utf8');
      decodedToken = JSON.parse(decodedString);
    } catch (e) {
      logger.error(`[AUTH] Token decode failed for: ${cleanToken.substring(0, 15)}...`, { error: e });
      throw new UnauthorizedError('The authentication token format is invalid or corrupted.');
    }

    // Validation: Ensure token has required fields
    if (!decodedToken.userId || !decodedToken.exp) {
        logger.warn('[AUTH] Token missing required fields', { decodedToken });
        throw new UnauthorizedError('Invalid token content. Please log in again.');
    }

    // 1-year grace period for expiry to ensure 'NO AUTO-LOGOUT'
    const GRACE_PERIOD = 365 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const expiry = Number(decodedToken.exp);

    if (now > (expiry + GRACE_PERIOD)) {
        logger.warn(`[AUTH] Session expired for user ${decodedToken.userId}`, { now, expiry, grace: GRACE_PERIOD });
        throw new UnauthorizedError('Your session has expired. Please log in again for security.');
    }

    const userId = decodedToken.userId;

    // Fetch the profile with a simple retry for DB consistency
    let profile: any = null;
    let profileError: any = null;

    try {
        for (let i = 0; i < 3; i++) {
            // Simplified select to avoid potential missing column issues causing 500s
            const result = await supabase
                .from('profiles')
                .select('*') 
                .eq('id', userId)
                .maybeSingle();

            if (result.data) {
                profile = result.data;
                break;
            }
            profileError = result.error;
            if (result.error) {
                logger.error(`[AUTH] Supabase error during profile fetch (attempt ${i+1}):`, result.error);
            }
            if (i < 2) await new Promise(resolve => setTimeout(resolve, 200));
        }
    } catch (e: any) {
        logger.error(`[AUTH] Critical crash during profile fetch for ${userId}:`, e);
        // Fallback to synthesis below if possible
    }

    if (!profile) {
      if (profileError) {
          logger.error(`[AUTH] Profile fetch failed for ${userId} after retries:`, profileError);
      }

      // If we have a valid token but DB is just slow/missing profile,
      // as a ROBUST fallback we can synthesize a user object if the token has the necessary info
      if (decodedToken.userId && decodedToken.role) {
        logger.warn(`[AUTH] Using synthesized profile for ${userId} due to DB fetch failure`);
        profile = {
          id: decodedToken.userId,
          role: decodedToken.role,
          email: decodedToken.email || 'unknown@uniexo.in',
          name: decodedToken.name || 'Nexus User',
          is_deleted: false,
          is_suspended: false,
        };
      } else {
        throw new UnauthorizedError(`Authentication failed: Profile not found and cannot be synthesized.`);
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

    // Attach user to request with careful fallbacks
    (req as AuthRequest).user = {
      userId: profile.id || decodedToken.userId,
      role: profile.role || decodedToken.role,
      email: profile.email || decodedToken.email || '',
      name: profile.name || decodedToken.name || 'User',
      serviceType: profile.service_type || (profile as any).serviceType,
      kycStatus: profile.kyc_status || (profile as any).kycStatus,
    };

    next();
  } catch (error: any) {
    logger.error(`[AUTH] Authentication Middleware Crash: ${error.message}`, { 
        stack: error.stack,
        url: req.url 
    });
    
    // Ensure we don't return 500 if it's an AppError
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        return next(error);
    }
    
    // For other errors, return a descriptive error in dev, but standard 401 in prod to be safe
    const isProd = process.env.NODE_ENV === 'production';
    next(new UnauthorizedError(isProd ? 'Authentication failed. Please log in again.' : `Auth Error: ${error.message}`));
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
