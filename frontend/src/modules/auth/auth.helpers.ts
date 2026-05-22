import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export const authHelpers = {
  /**
   * Atomically generates a UNI-XXXX ID using the counter table
   */
  async generateUniId(): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('uni_id_counter')
      .update({ id: 1 })
      .eq('id', 1)
      .select('current_value')
      .single();

    let nextValue = 1;
    if (data) {
       nextValue = data.current_value + 1;
       await supabaseAdmin.from('uni_id_counter').update({ current_value: nextValue }).eq('id', 1);
    } else {
       await supabaseAdmin.from('uni_id_counter').insert({ id: 1, current_value: 1 });
    }

    return `UNI-${nextValue.toString().padStart(4, '0')}`;
  },

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash) return false;
    return bcrypt.compare(password, hash);
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
      nbf: now - 300, // Not Before: 5 minutes leeway for clock skew
      exp: now + (10 * 365 * 24 * 60 * 60), // 10 years in seconds
    };
    
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    
    return `${header}.${body}.${signature}`;
  },

  verifyToken(token: string): any | null {
    try {
      const [header, body, signature] = token.split('.');
      if (!header || !body || !signature) return null;
      
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');
      
      if (signature !== expectedSignature) return null;
      
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      const now = Math.floor(Date.now() / 1000);

      // Check Expiry
      if (payload.exp && now > payload.exp) return null;
      
      // Check Not Before (with small leeway)
      if (payload.nbf && now < (payload.nbf - 300)) return null;
      
      return payload;
    } catch {
      return null;
    }
  },

  sanitizeProfile(dbProfile: any): User {
    return {
      id: dbProfile.id,
      uniId: dbProfile.uni_id,
      name: dbProfile.name,
      email: dbProfile.email,
      phone: dbProfile.phone,
      role: dbProfile.role,
      authProvider: dbProfile.auth_provider || 'email',
      avatar: dbProfile.avatar_url,
      universityId: dbProfile.university_id,
      location: dbProfile.location,
      kycStatus: dbProfile.kyc_status,
      businessName: dbProfile.business_name,
      serviceType: dbProfile.service_type,
    };
  }
};
