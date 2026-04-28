import { redis } from '../config/redis';
import { generateOTP } from '../utils/helpers';
import { OTPLog } from '../database/models';
import { logger } from '../config/logger';
import { EmailService } from './email.service';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes (TTL)
const OTP_PREFIX = 'otp';

export class OTPService {
  /**
   * Generates a secure random OTP, stores it in Redis with TTL, 
   * and automatically sends it to the user's email.
   */
  static async generateAndSend(
    email: string,
    purpose: string,
    userData?: Record<string, unknown>
  ): Promise<string> {
    // 1. Generate secure OTP
    const otp = generateOTP(6);
    const key = `${OTP_PREFIX}:${purpose}:${email}`;

    // 2. Store in Redis for auto-expiry (Dynamic validation)
    const data = JSON.stringify({ otp, email, purpose, userData });
    await redis.set(key, data, 'EX', OTP_EXPIRY_SECONDS);

    // 3. Send via Email automatically
    await EmailService.sendOTP(email, otp, purpose);

    // 4. Log for audit trails
    await OTPLog.create({
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000),
    });

    logger.info(`OTP Engine: Generated and sent ${purpose} OTP to ${email}`);
    
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
    const otp = generateOTP();
    const key = `${OTP_PREFIX}:${purpose}:${email}`;

    const data = JSON.stringify({ otp, email, purpose, userData });
    await redis.set(key, data, 'EX', OTP_EXPIRY_SECONDS);

    // Log OTP for audit
    await OTPLog.create({
      email,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000),
    });

    logger.info(`OTP generated for ${email} (${purpose})`);
    console.log(`\n========== OTP ==========`);
    console.log(`  Email  : ${email}`);
    console.log(`  OTP    : ${otp}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`=========================\n`);
    return otp;
  }

  static async verify(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<{ valid: boolean; userData?: Record<string, unknown> }> {
    const key = `${OTP_PREFIX}:${purpose}:${email}`;
    const stored = await redis.get(key);

    if (!stored) {
      return { valid: false };
    }

    const data = JSON.parse(stored);
    if (data.otp !== otp) {
      return { valid: false };
    }

    // Delete OTP after successful verification
    await redis.del(key);

    // Mark as used in log
    await OTPLog.findOneAndUpdate(
      { email, otp, purpose, isUsed: false },
      { isUsed: true },
      { sort: { createdAt: -1 } },
    );

    return { valid: true, userData: data.userData };
  }

  static async invalidate(email: string, purpose: string): Promise<void> {
    const key = `${OTP_PREFIX}:${purpose}:${email}`;
    await redis.del(key);
  }
}
