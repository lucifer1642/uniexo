import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { JWTPayload } from '../types';

export class TokenService {
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });
  }

  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
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

  static async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    try {
      await redis.set(`bl:${token}`, '1', 'EX', expiresInSeconds);
    } catch (err) {
      logger.warn(
        'Redis blacklistToken failed; revoke listing unavailable until REDIS_URL is configured',
        err,
      );
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await redis.get(`bl:${token}`);
      return result !== null;
    } catch (err) {
      logger.warn('Redis isTokenBlacklisted failed; treating token as not blacklisted', err);
      return false;
    }
  }

  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      await redis.set(`rt:${userId}`, token, 'EX', 7 * 24 * 60 * 60);
    } catch (err) {
      logger.warn(
        'Redis storeRefreshToken failed; login still succeeds but set REDIS_URL (e.g. Upstash) for refresh rotation',
        err,
      );
    }
  }

  static async getStoredRefreshToken(userId: string): Promise<string | null> {
    try {
      return await redis.get(`rt:${userId}`);
    } catch (err) {
      logger.warn('Redis getStoredRefreshToken failed', err);
      return null;
    }
  }

  static async removeRefreshToken(userId: string): Promise<void> {
    try {
      await redis.del(`rt:${userId}`);
    } catch (err) {
      logger.warn('Redis removeRefreshToken failed', err);
    }
  }
}
