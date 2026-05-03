import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { JWTPayload } from '../types';

/** JWT helpers for auth. Sessions are anchored in Supabase (`profiles.refresh_token`). */
export class TokenService {
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
    });
  }

  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
    });
  }

  static generateTokenPair(payload: JWTPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: TokenService.generateAccessToken(payload),
      refreshToken: TokenService.generateRefreshToken(payload),
    };
  }

  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
  }

  static async blacklistToken(_token: string, _expiresInSeconds: number): Promise<void> {
    logger.warn('Token blacklist skipped (MongoDB removed; use refresh_token rotation via Supabase).');
  }

  static async isTokenBlacklisted(_token: string): Promise<boolean> {
    return false;
  }
}
