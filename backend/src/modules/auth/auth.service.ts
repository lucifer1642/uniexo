import bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { TokenService } from '../../services/token.service';
import { EmailService } from '../../services/email.service';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../utils/errors';
import { UserRole } from '../../types/enums';
import { logger } from '../../config/logger';

export class AuthService {
  private authRepo: AuthRepository;

  constructor() {
    this.authRepo = new AuthRepository();
  }

  async initiateSignup(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
    businessName?: string;
    serviceType?: string;
    universityId?: string;
    location?: string;
  }): Promise<void> {
    const existing = await this.authRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      await this.authRepo.createOTP({
        email: data.email,
        otp,
        purpose: 'signup',
        userData: { ...data, password: hashedPassword }
      });
      logger.info(`OTP created in DB for ${data.email}`);
    } catch (error) {
      logger.error('Failed to create OTP in DB', error);
      throw error;
    }

    try {
      await EmailService.sendOTP(data.email, otp, 'signup');
      logger.info(`OTP email sent to ${data.email}`);
    } catch (error) {
      logger.error('Failed to send OTP email', error);
      throw error;
    }
  }

  async verifySignupOTP(email: string, otp: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    const otpLog = await this.authRepo.findOTP(email, otp, 'signup');
    if (!otpLog) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    const userData = otpLog.user_data;
    const profile = await this.authRepo.createUser({
      ...userData,
      is_verified: true
    });
    
    await this.authRepo.deleteOTP(email, 'signup');

    const tokens = TokenService.generateTokenPair({
      userId: profile.id,
      role: profile.role,
      email: profile.email
    });

    await this.authRepo.updateRefreshToken(profile.id, tokens.refreshToken);

    return {
      accessToken: tokens.refreshToken, // Use refresh token as access token for DB-backed sessions
      refreshToken: tokens.refreshToken,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      }
    };
  }

  async login(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    logger.info(`Login attempt for ${email}`);
    const user = await this.authRepo.findByEmailWithPassword(email);
    if (!user) {
      logger.warn(`Login failed: User not found for ${email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.password) {
      logger.warn(`Login failed: No local password set for ${email}. User may need to reset password.`);
      throw new UnauthorizedError('Please reset your password to migrate to the new login system');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: Password mismatch for ${email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = TokenService.generateTokenPair({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    await this.authRepo.updateRefreshToken(user.id, tokens.refreshToken);
    logger.info(`Login successful for ${email}`);

    return {
      accessToken: tokens.refreshToken, // Use refresh token as access token for DB-backed sessions
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = TokenService.verifyRefreshToken(refreshToken);
      const user = await this.authRepo.findById(payload.userId);
      
      if (!user || user.refresh_token !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = TokenService.generateTokenPair({
        userId: user.id,
        role: user.role,
        email: user.email
      });

      await this.authRepo.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        accessToken: tokens.refreshToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.authRepo.updateRefreshToken(userId, null);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepo.findByEmail(email);
    if (!user) return; // Silent return for security

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authRepo.createOTP({ email, otp, purpose: 'password-reset' });
    await EmailService.sendOTP(email, otp, 'password-reset');
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const otpLog = await this.authRepo.findOTP(email, otp, 'password-reset');
    if (!otpLog) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.authRepo.updatePassword(email, hashedPassword);
    await this.authRepo.deleteOTP(email, 'password-reset');
  }

  async resendOTP(email: string, purpose: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authRepo.createOTP({ email, otp, purpose });
    await EmailService.sendOTP(email, otp, purpose);
  }
}
