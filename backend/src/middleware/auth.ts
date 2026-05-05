import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

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
      logger.warn(`[AUTH] Invalid token format detected`);
      throw new UnauthorizedError('The authentication token provided is invalid or malformed. Please log in again.');
    }

    // Decode our simple base64 token
    let decodedToken;
    try {
        decodedToken = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    } catch (e) {
        throw new UnauthorizedError('Invalid token format');
    }

    // 5-minute grace period for expiry to avoid clock skew issues
    const GRACE_PERIOD = 5 * 60 * 1000;
    if (Date.now() > (decodedToken.exp + GRACE_PERIOD)) {
        throw new UnauthorizedError('Your session has expired. Please log in again.');
    }

    // Fetch the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, name, is_deleted, is_suspended')
      .eq('id', decodedToken.userId)
      .maybeSingle();

    if (profileError || !profile) {
      logger.error(`[AUTH] Profile fetch error for ${decodedToken.userId}`, { error: profileError?.message });
      throw new UnauthorizedError(`Unable to verify profile. ${profileError?.message || 'Profile record not found.'}`);
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
      name: profile.name
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

    let decodedToken;
    try {
        decodedToken = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    } catch (e) {
        return next();
    }

    if (Date.now() > decodedToken.exp) return next();

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
        name: profile.name
      };
    }
    next();
  } catch (err) {
    logger.debug('[AUTH] Optional auth suppressed error:', err);
    next();
  }
};

