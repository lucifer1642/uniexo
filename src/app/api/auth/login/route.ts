import { NextResponse } from 'next/server';
import crypto from 'crypto';

// ── SELF-CONTAINED LOGIN ROUTE ────────────────────────────────
// Zero external module imports that could hang during cold-start.

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('[LOGIN API] FATAL: JWT_SECRET or JWT_ACCESS_SECRET environment variable is not set.');
  }
  return secret;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return `${local[0]}***@${domain}`;
}

function sanitizeProfile(dbProfile: any) {
  return {
    id: dbProfile.id,
    uniId: dbProfile.uni_id || '',
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

function generateToken(user: any): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId: user.id,
    uniId: user.uniId,
    role: user.role,
    email: user.email,
    name: user.name,
    iat: now,
    nbf: now - 300,
    exp: now + 90 * 24 * 60 * 60, // 90 days
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export async function POST(req: Request) {
  console.log('[LOGIN API] Received POST request');
  try {
    const body = await req.json();
    const { email, password } = body;
    console.log('[LOGIN API] Email:', maskEmail(email));

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 200 }
      );
    }

    // ── Query Supabase (lazy import to avoid cold-start hangs) ──
    console.log('[LOGIN API] Lazy-loading Supabase...');
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[LOGIN API] Missing Supabase env vars!');
      return NextResponse.json(
        { success: false, error: 'Server configuration error. Contact admin.' },
        { status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('[LOGIN API] Querying profiles table...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim())
      .maybeSingle();

    if (error) {
      console.error('[LOGIN API] DB error:', error);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 200 });
    }
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 200 });
    }

    if (!profile.password_hash) {
      if (profile.auth_provider === 'google') {
        return NextResponse.json({ success: false, error: 'Please sign in with Google.' }, { status: 200 });
      }
      return NextResponse.json({ success: false, error: 'No password set. Please sign up again.' }, { status: 200 });
    }

    console.log('[LOGIN API] Verifying password...');
    const bcrypt = await import('bcryptjs');
    const isMatch = bcrypt.compareSync(password, profile.password_hash);
    console.log('[LOGIN API] Password match:', isMatch);

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 200 });
    }

    if (profile.is_deleted) {
      return NextResponse.json({ success: false, error: 'Account deleted.' }, { status: 200 });
    }
    if (profile.is_suspended) {
      return NextResponse.json({ success: false, error: 'Account suspended.' }, { status: 200 });
    }

    console.log('[LOGIN API] Generating token...');
    const safeProfile = sanitizeProfile(profile);
    const token = generateToken(safeProfile);

    console.log('[LOGIN API] Returning success');
    return NextResponse.json({ success: true, token, profile: safeProfile }, { status: 200 });
  } catch (err: any) {
    console.error('[LOGIN API] Uncaught Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 200 });
  }
}
