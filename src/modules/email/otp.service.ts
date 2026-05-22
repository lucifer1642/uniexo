import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import { sendEmail } from './email.service';
import { otpEmailTemplate } from './templates/otp';
import { OTP_ENABLED } from './email.config';

/**
 * OTP Service — generate, send, verify, resend.
 * All methods return success/error objects. NEVER throw.
 */
export const otpService = {
  /**
   * Generate a 6-digit OTP, hash it, store in DB, and send via email.
   */
  async sendOtp(email: string, purpose: string = 'signup'): Promise<{ success: boolean; error?: string }> {
    if (!OTP_ENABLED) return { success: true }; // Skip silently

    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 6);

      // Invalidate old OTPs for this email+purpose
      await supabaseAdmin
        .from('otp_codes')
        .delete()
        .eq('email', email.trim())
        .eq('purpose', purpose);

      // Insert new OTP (expires in 10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabaseAdmin.from('otp_codes').insert({
        email: email.trim(),
        code_hash: codeHash,
        purpose,
        expires_at: expiresAt,
      });

      // Send email with OTP
      await sendEmail({
        to: email.trim(),
        subject: `Your UniExo Verification Code: ${code}`,
        html: otpEmailTemplate(code),
      });

      return { success: true };
    } catch (err: any) {
      console.error('[OTP SERVICE] sendOtp error:', err.message);
      return { success: false, error: 'Failed to send OTP.' };
    }
  },

  /**
   * Verify an OTP code against the stored hash.
   */
  async verifyOtp(email: string, code: string, purpose: string = 'signup'): Promise<{ success: boolean; error?: string }> {
    if (!OTP_ENABLED) return { success: true }; // Skip silently

    try {
      // Find the latest OTP for this email+purpose
      const { data: otpRecord, error } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('email', email.trim())
        .eq('purpose', purpose)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !otpRecord) {
        return { success: false, error: 'No OTP found. Please request a new one.' };
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        return { success: false, error: 'OTP has expired. Please request a new one.' };
      }

      // Check max attempts (5)
      if (otpRecord.attempts >= 5) {
        return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
      }

      // Increment attempt count
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      // Verify code
      const isValid = await bcrypt.compare(code, otpRecord.code_hash);
      if (!isValid) {
        return { success: false, error: 'Invalid OTP. Please try again.' };
      }

      // Mark as verified
      await supabaseAdmin
        .from('otp_codes')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      // Mark email as verified in profiles
      await supabaseAdmin
        .from('profiles')
        .update({ email_verified: true })
        .eq('email', email.trim());

      return { success: true };
    } catch (err: any) {
      console.error('[OTP SERVICE] verifyOtp error:', err.message);
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  },

  /**
   * Resend OTP — just calls sendOtp again (which invalidates old one first).
   */
  async resendOtp(email: string, purpose: string = 'signup'): Promise<{ success: boolean; error?: string }> {
    return this.sendOtp(email, purpose);
  },
};
