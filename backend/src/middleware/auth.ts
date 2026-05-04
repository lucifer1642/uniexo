import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../config/logger';
import { supabase } from '../config/supabase';

/**
 * Authenticate middleware — verifies the Supabase JWT from the Authorization header
 * and attaches the user profile to the request.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Extract Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[AUTH] Missing or malformed Authorization header');
      throw new UnauthorizedError('No authentication token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
      logger.warn(`[AUTH] Invalid token format detected: "${token?.substring(0, 10)}..."`);
      throw new UnauthorizedError('The authentication token provided is invalid or malformed.');
    }

    // 2. Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.error('[AUTH] Supabase getUser failed', { 
        code: authError?.status, 
        message: authError?.message,
        tokenPrefix: token.substring(0, 15)
      });
      
      const message = authError?.message?.includes('JWT') 
        ? 'Your session has expired or is invalid. Please log in again.' 
        : `Authentication failed: ${authError?.message || 'User session not found'}`;
      
      throw new UnauthorizedError(message);
    }

    // 3. Fetch the profile from public.profiles
    // Note: We use maybeSingle() to prevent .single() from throwing if no row is found
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, name, is_deleted, is_suspended')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error(`[AUTH] Profile fetch error for ${user.id}`, { error: profileError.message });
      throw new UnauthorizedError('Platform error: Unable to verify your profile at this time.');
    }

    if (!profile) {
      logger.warn(`[AUTH] No profile found for user ${user.id} (${user.email})`);
      throw new UnauthorizedError('Authenticated but profile not found. Please complete your registration.');
    }

    if (profile.is_deleted) {
      logger.warn(`[AUTH] Access denied for deleted account: ${user.id}`);
      throw new UnauthorizedError('This account has been permanently deleted.');
    }

    if (profile.is_suspended) {
      logger.warn(`[AUTH] Access denied for suspended account: ${user.id}`);
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }

    // 4. Attach to request
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
    if (!token || token === 'undefined' || token === 'null' || token.length < 20) return next();

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return next();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, name')
      .eq('id', user.id)
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
