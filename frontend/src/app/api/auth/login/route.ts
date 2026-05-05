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

    // 1. Fetch user by email
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Verify password
    if (!profile.password_hash) {
      return NextResponse.json({ error: 'Account not set up with a password. Please sign up again.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, profile.password_hash);
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (profile.is_deleted) {
       return NextResponse.json({ error: 'This account has been deleted' }, { status: 403 });
    }
    
    if (profile.is_suspended) {
       return NextResponse.json({ error: 'This account is suspended' }, { status: 403 });
    }

    // 3. Create a simple session token (just use their ID for now, or generate a UUID)
    // In a full implementation we'd sign a JWT here. For simple token auth, we'll return
    // the user ID or a generated token that the frontend will send back.
    const token = Buffer.from(JSON.stringify({ userId: profile.id, role: profile.role, exp: Date.now() + 86400000 })).toString('base64');

    // Remove password hash from response
    const { password_hash, ...safeProfile } = profile;

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
