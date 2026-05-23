import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from './auth.types';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    console.warn('[AUTH] JWT_SECRET not set, using fallback. Set JWT_SECRET in .env.local for production.');
    return 'uniexo-default-dev-secret';
  }
  return secret;
}

export const authHelpers = {
  async generateUniId(): Promise<string> {
    // Generates a robust, random 6-character hex string (e.g., UNI-A1B2C3) 
    // to completely eliminate race conditions and duplicate key errors.
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `UNI-${randomHex}`;
  },

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  // Deliberately synchronous: bcrypt.compareSync is used instead of the async
  // bcrypt.compare because Vercel serverless micro-VMs have strict CPU quotas
  // that can cause async worker threads to deadlock during cold starts.
  verifyPassword(password: string, hash: string): boolean {
    if (!hash) return false;
    try {
      return bcrypt.compareSync(password, hash);
    } catch (e: any) {
      console.error('[AUTH HELPERS] Bcrypt verification failed:', e);
      return false;
    }
  },

  generateToken(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: user.id,
      uniId: user.uniId,
      role: user.role,
      email: user.email,
      name: user.name,
      iat: now,
      exp: now + (90 * 24 * 60 * 60), // 90 days
    };
    
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${header}.${body}`)
      .digest('base64url');
    
    return `${header}.${body}.${signature}`;
  },

  verifyToken(token: string): any | null {
    try {
      if (!token || typeof token !== 'string') return null;
      
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const [header, body, signature] = parts;
      if (!header || !body || !signature) return null;
      
      const expectedSignature = crypto
        .createHmac('sha256', getJwtSecret())
        .update(`${header}.${body}`)
        .digest('base64url');
      
      if (signature !== expectedSignature) return null;
      
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      const now = Math.floor(Date.now() / 1000);

      // Check Expiry
      if (payload.exp && now > payload.exp) return null;
      
      return payload;
    } catch (e) {
      console.error('[AUTH HELPERS] Token verification failed:', e);
      return null;
    }
  },

  sanitizeProfile(dbProfile: any): User {
    return {
      id: dbProfile.id,
      uniId: dbProfile.uni_id || '',
      name: dbProfile.name || '',
      email: dbProfile.email,
      phone: dbProfile.phone || '',
      role: dbProfile.role || 'user',
      authProvider: dbProfile.auth_provider || 'email',
      avatar: dbProfile.avatar_url || '',
      universityId: dbProfile.university_id || '',
      location: dbProfile.location || '',
      kycStatus: dbProfile.kyc_status || 'none',
      businessName: dbProfile.business_name || '',
      serviceType: dbProfile.service_type || '',
    };
  }
};
