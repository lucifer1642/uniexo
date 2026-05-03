import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../config/logger';
import { AuthRepository } from '../modules/auth/auth.repository';

const authRepo = new AuthRepository();

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

    const user = await authRepo.findByToken(token);
    if (!user) {
      logger.warn('Auth failed: Token not found in DB');
      throw new UnauthorizedError('Invalid or expired session');
    }

    (req as AuthRequest).user = {
      userId: user.id,
      role: user.role,
      email: user.email
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
    const user = await authRepo.findByToken(token);
    if (user) {
      (req as AuthRequest).user = {
        userId: user.id,
        role: user.role,
        email: user.email
      };
    }
    next();
  } catch {
    next();
  }
};
