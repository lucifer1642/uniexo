/**
 * Email Module Feature Flags
 * If SMTP_HOST is not set, the entire email module is disabled.
 * If OTP_ENABLED is 'false', OTP step is skipped even if email works.
 */
export const EMAIL_MODULE_ENABLED = !!process.env.SMTP_HOST;
export const OTP_ENABLED = EMAIL_MODULE_ENABLED && process.env.OTP_ENABLED !== 'false';

export const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

export const SMTP_FROM = process.env.SMTP_FROM || 'UniExo <noreply@uniexo.in>';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://uniexo.in';
