import { NextResponse } from 'next/server';

// ── SELF-CONTAINED LOGIN ROUTE ────────────────────────────────
// Minimal external imports to avoid cold-start issues on Vercel.

export async function POST(req: Request) {
  console.log('[LOGIN API] Received POST request');
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 200 }
      );
    }

    console.log('[LOGIN API] Email:', email.replace(/(?<=.).(?=.*@)/g, '*'));

    // ── Lazy-load Supabase ──
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[LOGIN API] Missing Supabase env vars!');
      return NextResponse.json(
        { success: false, error: 'Server configuration error.' },
        { status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Query DB ──
    console.log('[LOGIN API] Querying profiles...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('[LOGIN API] DB error:', error);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 200 });
    }
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 200 });
    }

    // ── Check password ──
    if (!profile.password_hash) {
      if (profile.auth_provider === 'google') {
        return NextResponse.json({ success: false, error: 'Please sign in with Google.' }, { status: 200 });
      }
      return NextResponse.json({ success: false, error: 'No password set. Please sign up again.' }, { status: 200 });
    }

    console.log('[LOGIN API] Verifying password...');
    const bcrypt = await import('bcryptjs');
    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(password, profile.password_hash);
    } catch (bcryptErr) {
      console.error('[LOGIN API] Bcrypt compare error:', bcryptErr);
      return NextResponse.json({ success: false, error: 'Password verification failed.' }, { status: 200 });
    }
    console.log('[LOGIN API] Password match:', isMatch);

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 200 });
    }

    // ── Account status checks ──
    if (profile.is_deleted) {
      return NextResponse.json({ success: false, error: 'Account deleted.' }, { status: 200 });
    }
    if (profile.is_suspended) {
      return NextResponse.json({ success: false, error: 'Account suspended.' }, { status: 200 });
    }

    // ── Build response profile ──
    const safeProfile = {
      id: profile.id,
      uniId: profile.uni_id || '',
      name: profile.name || '',
      email: profile.email,
      phone: profile.phone || '',
      role: profile.role || 'user',
      authProvider: profile.auth_provider || 'email',
      avatar: profile.avatar_url || '',
      universityId: profile.university_id || '',
      location: profile.location || '',
      kycStatus: profile.kyc_status || 'none',
      businessName: profile.business_name || '',
      serviceType: profile.service_type || '',
    };

    // ── Generate JWT ──
    console.log('[LOGIN API] Generating token...');
    const crypto = await import('crypto');
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'uniexo-default-dev-secret';

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: safeProfile.id,
      uniId: safeProfile.uniId,
      role: safeProfile.role,
      email: safeProfile.email,
      name: safeProfile.name,
      iat: now,
      exp: now + 90 * 24 * 60 * 60, // 90 days
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', jwtSecret)
      .update(`${header}.${payloadB64}`)
      .digest('base64url');
    const token = `${header}.${payloadB64}.${signature}`;

    console.log('[LOGIN API] Login successful for:', safeProfile.email);
    const response = NextResponse.json({ success: true, token, profile: safeProfile }, { status: 200 });
    
    // Set cookie for middleware/server-components
    response.cookies.set({
      name: 'uniexo_token',
      value: token,
      httpOnly: false, // allow client-side to read if necessary
      path: '/',
      maxAge: 90 * 24 * 60 * 60, // 90 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('[LOGIN API] Uncaught Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 200 });
  }
}
