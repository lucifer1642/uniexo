import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../config/logger';
import { supabase } from '../config/supabase';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Auth failed: No bearer token');
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Auth failed: Invalid Supabase token');
      throw new UnauthorizedError('Invalid or expired session');
    }

    // Retrieve full profile from our DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      logger.warn(`Auth failed: Profile missing for user ${user.id}`);
      throw new UnauthorizedError('User profile not found');
    }

    (req as AuthRequest).user = {
      userId: profile.id,
      role: profile.role,
      email: profile.email
    };
    next();
  } catch (error) {
    next(error);
  }
};

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
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        (req as AuthRequest).user = {
          userId: profile.id,
          role: profile.role,
          email: profile.email
        };
      }
    }
    next();
  } catch {
    next();
  }
};
