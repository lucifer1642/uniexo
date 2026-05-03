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
      logger.warn('Auth: missing bearer token');
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      logger.warn('Auth: token is empty/undefined');
      throw new UnauthorizedError('Invalid access token');
    }

    // 2. Verify token with Supabase Auth (uses service role key)
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(`Auth: Supabase rejected token — ${error?.message || 'no user'}`);
      throw new UnauthorizedError('Invalid or expired session');
    }

    // 3. Fetch the profile from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, name, is_deleted, is_suspended')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.warn(`Auth: profile not found for ${user.id} — ${profileError?.message}`);
      throw new UnauthorizedError('User profile not found. Please sign up again.');
    }

    if (profile.is_deleted) {
      throw new UnauthorizedError('This account has been deleted');
    }

    if (profile.is_suspended) {
      throw new UnauthorizedError('This account has been suspended');
    }

    // 4. Attach to request
    (req as AuthRequest).user = {
      userId: profile.id,
      role: profile.role,
      email: profile.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth — same logic but silently continues if no token is provided.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return next();
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        (req as AuthRequest).user = {
          userId: profile.id,
          role: profile.role,
          email: profile.email,
        };
      }
    }
    next();
  } catch {
    // Silent fail for optional auth
    next();
  }
};
