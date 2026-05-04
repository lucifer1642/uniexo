/**
 * OTPService — backed by Supabase `otp_logs` table.
 */
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { EmailService } from './email.service';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateOTP(length = 6): string {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
}

export class OTPService {
  static async generateAndSend(
    email: string,
    purpose: string,
    userData?: Record<string, unknown>,
  ): Promise<string> {
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

    await supabase.from('otp_logs').insert({
      email: email.toLowerCase(),
      otp,
      purpose,
      user_data: userData ?? null,
      expires_at: expiresAt,
    });

    try {
      await EmailService.sendOTP(email, otp, purpose);
      logger.info(`OTP sent for ${purpose} to ${email}`);
    } catch (err) {
      logger.error(`OTP Email Failure for ${email}:`, err);
      throw new Error('Failed to deliver OTP email. Please check your configuration.');
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[OTP DEBUG] ${email} (${purpose}) -> ${otp}\n`);
    }
    return otp;
  }

  static async generate(
    email: string,
    purpose: string,
    userData?: Record<string, unknown>,
  ): Promise<string> {
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

    await supabase.from('otp_logs').insert({
      email: email.toLowerCase(),
      otp,
      purpose,
      user_data: userData ?? null,
      expires_at: expiresAt,
    });

    logger.info(`OTP generated for ${email} (${purpose})`);
    return otp;
  }

  static async verify(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<{ valid: boolean; userData?: Record<string, unknown> }> {
    const { data, error } = await supabase
      .from('otp_logs')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .eq('purpose', purpose)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return { valid: false };

    // Delete used OTP
    await supabase.from('otp_logs').delete().eq('id', data.id);

    return { valid: true, userData: data.user_data ?? undefined };
  }

  static async invalidate(email: string, purpose: string): Promise<void> {
    await supabase
      .from('otp_logs')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose);
  }
}
