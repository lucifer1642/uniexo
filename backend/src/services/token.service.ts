import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { JWTPayload } from '../types';
import { User, BlacklistedToken } from '../database/models';

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
      await BlacklistedToken.create({
        token,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      });
    } catch (err) {
      logger.warn('Failed to blacklist token in DB', err);
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await BlacklistedToken.findOne({ token });
      return result !== null;
    } catch (err) {
      logger.warn('Failed to check token blacklist in DB; treating as not blacklisted', err);
      return false;
    }
  }

  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, { refreshToken: token });
    } catch (err) {
      logger.warn('Failed to store refresh token in User document', err);
    }
  }

  static async getStoredRefreshToken(userId: string): Promise<string | null> {
    try {
      const user = await User.findById(userId).select('+refreshToken');
      return user?.refreshToken || null;
    } catch (err) {
      logger.warn('Failed to get stored refresh token', err);
      return null;
    }
  }

  static async removeRefreshToken(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    } catch (err) {
      logger.warn('Failed to remove refresh token from User document', err);
    }
  }
}
