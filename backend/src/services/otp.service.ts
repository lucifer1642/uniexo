import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { EmailService } from './email.service';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Universal OTP Engine for UniExo
 * - Generates, stores, sends, verifies, and cleans up OTPs
 * - All OTPs stored in Supabase `otp_logs` table
 * - Expired OTPs auto-purged every 10 minutes via cron
 */
export class OTPEngine {
  /**
   * Generates a 6-digit OTP and sends it via email.
   * The OTP is always stored in Supabase regardless of email delivery status.
   */
  static async send(email: string, purpose: string, userData: any = null): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

    logger.info(`[OTP-ENGINE] Generating OTP for ${email} (${purpose})`);

    // 1. Invalidate previous OTPs for this email/purpose
    await supabase.from('otp_logs').delete().eq('email', email.toLowerCase()).eq('purpose', purpose);

    // 2. Insert new OTP into Supabase
    const { error } = await supabase.from('otp_logs').insert({
      email: email.toLowerCase(),
      otp,
      purpose,
      user_data: userData,
      expires_at: expiresAt,
    });

    if (error) {
      logger.error(`[OTP-ENGINE] Database insert failed:`, error);
      // Don't throw here — if DB fails, we still want to try sending via SMTP or returning it for fallback
    }

    // 3. Send via Email (SMTP)
    try {
      await EmailService.sendOTP(email, otp, purpose);
      logger.info(`[OTP-ENGINE] OTP sent successfully via SMTP to ${email}`);
    } catch (err) {
      // SMTP failed — OTP is still in DB, log it for developer visibility
      logger.error(`[OTP-ENGINE] SMTP delivery failed for ${email}:`, err);
      console.log(`\n========================================`);
      console.log(`[OTP-FALLBACK] SMTP failed. OTP for ${email}: ${otp}`);
      console.log(`[OTP-FALLBACK] Purpose: ${purpose} | Expires: ${expiresAt}`);
      console.log(`========================================\n`);
    }

    return otp;
  }

  /**
   * Verifies an OTP against the Supabase `otp_logs` table.
   * Returns { valid, userData } on success.
   * All verification goes through the database — no hardcoded bypass codes.
   */
  static async verify(email: string, otp: string, purpose: string): Promise<{ valid: boolean; userData?: any }> {
    logger.info(`[OTP-ENGINE] Verifying OTP for ${email} (purpose: ${purpose})`);

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

    // Delete used OTP (one-time use)
    await supabase.from('otp_logs').delete().eq('id', data.id);

    logger.info(`[OTP-ENGINE] OTP verified successfully for ${email}`);
    return { valid: true, userData: data.user_data };
  }

  /**
   * Purges all expired OTPs from the database.
   * Called by cron job every 10 minutes.
   */
  static async cleanup(): Promise<number> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('otp_logs')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (error) {
      logger.error(`[OTP-ENGINE] Cleanup failed:`, error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      logger.info(`[OTP-ENGINE] Cleaned up ${count} expired OTP(s)`);
    }
    return count;
  }
}
