import { AuthRepository } from './auth.repository';
import { supabase } from '../../config/supabase';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../utils/errors';
import { UserRole } from '../../types/enums';

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
  }): Promise<void> {
    const existing = await this.authRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role || UserRole.USER,
          phone: data.phone,
        },
      },
    });

    if (error) throw new BadRequestError(error.message);
  }

  async verifySignupOTP(email: string, otp: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
  }> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (error || !data.user || !data.session) {
      throw new BadRequestError(error?.message || 'Invalid or expired OTP');
    }

    const user = data.user;
    const profile = await this.authRepo.findById(user.id);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: user.id,
        name: profile?.name || user.user_metadata.name,
        email: user.email,
        phone: profile?.phone || user.user_metadata.phone,
        role: profile?.role || user.user_metadata.role,
      },
    };
  }

  async login(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
  }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedError(error?.message || 'Invalid email or password');
    }

    const user = data.user;
    const profile = await this.authRepo.findById(user.id);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: user.id,
        name: profile?.name || user.user_metadata.name,
        email: user.email,
        phone: profile?.phone || user.user_metadata.phone,
        role: profile?.role || user.user_metadata.role,
        kycStatus: profile?.kyc_status,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      // Don't reveal whether the email exists for security, but log it
      console.error('Password reset error:', error.message);
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    // 1. Verify OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });

    if (verifyError) throw new BadRequestError(verifyError.message);

    // 2. Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw new BadRequestError(updateError.message);
  }

  async resendOTP(email: string, purpose: string): Promise<void> {
    const type = purpose === 'signup' ? 'signup' : 'recovery';
    const { error } = await supabase.auth.resend({
      type: type as any,
      email,
    });

    if (error) throw new BadRequestError(error.message);
  }
}
