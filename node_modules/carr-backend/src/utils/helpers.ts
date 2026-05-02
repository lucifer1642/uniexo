import crypto from 'crypto';

export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

export function generateReceiptId(): string {
  return `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}
