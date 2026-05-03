import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, JWTPayload } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { TokenService } from '../services/token.service';
import { logger } from '../config/logger';

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

    if (await TokenService.isTokenBlacklisted(token)) {
      logger.warn('Auth failed: Token blacklisted');
      throw new UnauthorizedError('Token has been revoked');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
      (req as AuthRequest).user = decoded;
      next();
    } catch (err) {
      logger.error('JWT verification failed', err);
      throw err;
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid access token'));
    } else {
      next(error);
    }
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
    if (await TokenService.isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    next();
  }
};
