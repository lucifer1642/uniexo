import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
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
    await redis.set(`bl:${token}`, '1', 'EX', expiresInSeconds);
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await redis.get(`bl:${token}`);
    return result !== null;
  }

  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    // Store refresh token with 7 days expiry
    await redis.set(`rt:${userId}`, token, 'EX', 7 * 24 * 60 * 60);
  }

  static async getStoredRefreshToken(userId: string): Promise<string | null> {
    return redis.get(`rt:${userId}`);
  }

  static async removeRefreshToken(userId: string): Promise<void> {
    await redis.del(`rt:${userId}`);
  }
}
