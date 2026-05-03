import bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { OTPService } from '../../services/otp.service';
import { TokenService } from '../../services/token.service';
import { JWTPayload } from '../../types';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../utils/errors';
import { Wallet, VendorProfile } from '../../database/models';
import { UserRole } from '../../types/enums';

const SALT_ROUNDS = 12;

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

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const userData = { ...data, password: hashedPassword };

    await OTPService.generateAndSend(data.email, 'signup', userData as any);
  }

  async verifySignupOTP(email: string, otp: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
  }> {
    const result = await OTPService.verify(email, otp, 'signup');
    if (!result.valid || !result.userData) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    const existing = await this.authRepo.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const user = await this.authRepo.createUser({
      name: result.userData.name as string,
      email: result.userData.email as string,
      phone: result.userData.phone as string,
      password: result.userData.password as string,
      role: (result.userData.role as UserRole) || UserRole.USER,
      isEmailVerified: true,
      universityId: result.userData.universityId as string,
      location: result.userData.location as string,
    });

    const userData = result.userData;

    // Create wallet and profile in background to speed up verification response
    Promise.all([
      Wallet.create({ userId: user._id }),
      user.role === UserRole.VENDOR ? (async () => {
        const vendorData: any = {
          userId: user._id,
          businessName: (userData.businessName as string) || user.name,
          serviceType: (userData.serviceType as string) || 'CAR',
          email: user.email,
          businessAddress: '',
          businessPhone: user.phone || '',
          description: '',
        };

        // For laundry vendors, store pickup preferences
        if (vendorData.serviceType === 'LAUNDRY') {
          vendorData.onsitePickup = userData.onsitePickup ?? false;
          vendorData.onStoreService = userData.onStoreService ?? true;
          vendorData.onsitePickupCharge = Number(userData.onsitePickupCharge) || 0;
        }

        await VendorProfile.create(vendorData);

        // Auto-create LaundryService entry for laundry vendors
        if (vendorData.serviceType === 'LAUNDRY') {
          const { LaundryService } = require('../../database/models');
          await LaundryService.create({
            vendorId: user._id,
            name: vendorData.businessName,
            description: `Laundry service by ${vendorData.businessName}`,
            providerName: user.name,
            providerPhone: user.phone || '',
            providerAddress: vendorData.businessAddress || 'Not provided',
            services: [],
            onsitePickup: vendorData.onsitePickup,
            onStoreService: vendorData.onStoreService,
            onsitePickupCharge: vendorData.onsitePickupCharge,
          });
        }
      })() : Promise.resolve()
    ]).catch(err => {
      // We log but don't fail the verification if these non-critical background tasks fail
      // In a production app, we might use a robust queue like BullMQ here
      console.error('Background Signup Task Failure:', err);
    });

    const payload: JWTPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens = TokenService.generateTokenPair(payload);
    await TokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        universityId: user.universityId,
        location: user.location,
        idCardPhotoUrl: user.idCardPhotoUrl,
      },
    };
  }

  async login(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
  }> {
    const user = await this.authRepo.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedError('Please verify your email first');
    }

    if (user.isSuspended) {
      throw new UnauthorizedError('Your account has been suspended');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const tokens = TokenService.generateTokenPair(payload);
    await TokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        universityId: user.universityId,
        location: user.location,
        idCardPhotoUrl: user.idCardPhotoUrl,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const decoded = TokenService.verifyRefreshToken(refreshToken);
      const storedToken = await TokenService.getStoredRefreshToken(decoded.userId);

      // When Redis is unavailable or login never persisted refresh (no REDIS_URL), storedToken is null:
      // trust JWT verification only. When Redis has a value, enforce rotation / reuse detection.
      if (storedToken != null && storedToken !== refreshToken) {
        await TokenService.removeRefreshToken(decoded.userId);
        throw new UnauthorizedError('Token reuse detected');
      }

      const user = await this.authRepo.findById(decoded.userId);
      if (!user || user.isSuspended) {
        throw new UnauthorizedError('User not found or suspended');
      }

      const payload: JWTPayload = {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      };

      // Rotate refresh token
      const tokens = TokenService.generateTokenPair(payload);
      await TokenService.storeRefreshToken(user._id.toString(), tokens.refreshToken);

      // Blacklist old refresh token
      await TokenService.blacklistToken(refreshToken, 7 * 24 * 60 * 60);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    await TokenService.removeRefreshToken(userId);
    // Blacklist access token for its remaining TTL (15 min max)
    await TokenService.blacklistToken(accessToken, 15 * 60);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return;
    }

    await OTPService.generateAndSend(email, 'password-reset');
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const result = await OTPService.verify(email, otp, 'password-reset');
    if (!result.valid) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.authRepo.updatePassword(user._id.toString(), hashedPassword);

    // Invalidate all sessions
    await TokenService.removeRefreshToken(user._id.toString());
  }

  async resendOTP(email: string, purpose: string): Promise<void> {
    if (purpose === 'signup') {
      // For signup, the user data must already be in Redis
      // Just regenerate OTP
    }

    await OTPService.generateAndSend(email, purpose);
  }
}
