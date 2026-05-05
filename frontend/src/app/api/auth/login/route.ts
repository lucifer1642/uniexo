import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log('[API-LOGIN] Attempt for:', email.trim());

    // 1. Fetch user by email
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email.trim())
      .maybeSingle();

    if (error || !profile) {
      console.log('[API-LOGIN] Failed: User not found or error:', email.trim());
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Verify password
    if (!profile.password_hash) {
      console.log('[API-LOGIN] Failed: No password_hash for user:', email.trim());
      return NextResponse.json({ error: 'Account not set up with a password. Please sign up again.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, profile.password_hash);
    
    if (!isMatch) {
      console.log('[API-LOGIN] Failed: Password mismatch for:', email.trim());
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (profile.is_deleted) {
       console.log('[API-LOGIN] Failed: Account deleted:', email.trim());
       return NextResponse.json({ error: 'This account has been deleted' }, { status: 403 });
    }
    
    if (profile.is_suspended) {
       console.log('[API-LOGIN] Failed: Account suspended:', email.trim());
       return NextResponse.json({ error: 'This account is suspended' }, { status: 403 });
    }

    // 3. Create a permanent session token (10 years)
    const TEN_YEARS = 10 * 365 * 24 * 60 * 60 * 1000;
    const token = Buffer.from(JSON.stringify({ userId: profile.id, role: profile.role, exp: Date.now() + TEN_YEARS })).toString('base64');

    // Remove password hash from response
    const { password_hash, ...safeProfile } = profile;

    console.log('[API-LOGIN] Success for:', email.trim());
    return NextResponse.json({
      success: true,
      token,
      profile: safeProfile
    });
  } catch (err: any) {
    console.error('[API-LOGIN] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
