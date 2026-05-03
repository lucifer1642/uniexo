import { generateOTP } from '../utils/helpers';
import { OTPLog } from '../database/models';
import { logger } from '../config/logger';
import { EmailService } from './email.service';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes (TTL)

export class OTPService {
  /**
   * Generates a secure random OTP, stores it in MongoDB with TTL, 
   * and automatically sends it to the user's email.
   */
  static async generateAndSend(
    email: string,
    purpose: string,
    userData?: Record<string, unknown>
  ): Promise<string> {
    const otp = generateOTP(6);

    // Store in DB
    await OTPLog.create({
      email,
      otp,
      purpose,
      userData,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000),
    });

    // Send via Email automatically - Fire and Forget for speed
    EmailService.sendOTP(email, otp, purpose).catch(err => {
      logger.error(`Background OTP Email Failure for ${email}:`, err);
    });

    logger.info(`OTP Engine: Triggered ${purpose} OTP to ${email}`);
    
    // In dev, we also log to console for convenience
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

    await OTPLog.create({
      email,
      otp,
      purpose,
      userData,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000),
    });

    logger.info(`OTP generated for ${email} (${purpose})`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n========== OTP ==========`);
      console.log(`  Email  : ${email}`);
      console.log(`  OTP    : ${otp}`);
      console.log(`  Purpose: ${purpose}`);
      console.log(`=========================\n`);
    }
    return otp;
  }

  static async verify(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<{ valid: boolean; userData?: Record<string, unknown> }> {
    // Find the most recent unexpired, unused OTP for this email and purpose
    const log = await OTPLog.findOne({
      email,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!log || log.otp !== otp) {
      return { valid: false };
    }

    // Mark as used
    log.isUsed = true;
    await log.save();

    return { valid: true, userData: log.userData };
  }

  static async invalidate(email: string, purpose: string): Promise<void> {
    await OTPLog.updateMany(
      { email, purpose, isUsed: false },
      { isUsed: true }
    );
  }
}
