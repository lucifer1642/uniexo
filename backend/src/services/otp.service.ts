import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { EmailService } from './email.service';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Universal OTP Engine for UniExo
 */
export class OTPEngine {
  /**
   * Generates a 6-digit OTP and sends it via email
   */
  static async send(email: string, purpose: string, userData: any = null): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

    logger.info(`[OTP-ENGINE] Generating OTP for ${email} (${purpose})`);

    // 1. Invalidate previous OTPs for this email/purpose
    await supabase.from('otp_logs').delete().eq('email', email.toLowerCase()).eq('purpose', purpose);

    // 2. Insert new OTP
    const { error } = await supabase.from('otp_logs').insert({
      email: email.toLowerCase(),
      otp,
      purpose,
      user_data: userData,
      expires_at: expiresAt,
    });

    if (error) {
      logger.error(`[OTP-ENGINE] Database insert failed:`, error);
      throw new Error('Internal security synchronization failed');
    }

    // 3. Send via Email
    try {
      await EmailService.sendOTP(email, otp, purpose);
      logger.info(`[OTP-ENGINE] OTP sent successfully to ${email}`);
    } catch (err) {
      logger.error(`[OTP-ENGINE] Email delivery failed:`, err);
      // BYPASS: Don't throw, just log it. This allows the frontend to show the OTP screen.
      console.log(`\n[BYPASS ENABLED] OTP FOR ${email}: ${otp} (OR USE 123456)\n`);
    }
  }

  /**
   * Verifies an OTP and returns user data if valid
   */
  static async verify(email: string, otp: string, purpose: string): Promise<{ valid: boolean; userData?: any }> {
    logger.info(`[OTP-ENGINE] Verifying OTP for ${email} (${purpose})`);

    // BYPASS: Allow 123456 for rapid testing
    if (otp === '123456') {
      logger.info(`[OTP-ENGINE] Bypass code 123456 used for ${email}`);
      return { valid: true };
    }

    const { data, error } = await supabase
      .from('otp_logs')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .eq('purpose', purpose)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.warn(`[OTP-ENGINE] Verification failed for ${email}: ${error?.message || 'Invalid or expired code'}`);
      return { valid: false };
    }

    // Delete used OTP
    await supabase.from('otp_logs').delete().eq('id', data.id);

    logger.info(`[OTP-ENGINE] OTP verified successfully for ${email}`);
    return { valid: true, userData: data.user_data };
  }
}
