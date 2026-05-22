import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authHelpers } from '@/modules/auth/auth.helpers';
import { notificationService } from '@/modules/email/notification.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 200 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email.trim())
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 200 });
    }

    if (!profile.password_hash) {
      // Account exists but no password (likely signed up via Google)
      if (profile.auth_provider === 'google') {
         return NextResponse.json({ success: false, error: 'Please sign in with Google.' }, { status: 200 });
      }
      return NextResponse.json({ success: false, error: 'Account not set up with a password. Please sign up again.' }, { status: 200 });
    }

    const isMatch = await authHelpers.verifyPassword(password, profile.password_hash);
    
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 200 });
    }

    if (profile.is_deleted) {
       return NextResponse.json({ success: false, error: 'This account has been deleted.' }, { status: 200 });
    }
    
    if (profile.is_suspended) {
       return NextResponse.json({ success: false, error: 'This account is suspended. Please contact support.' }, { status: 200 });
    }

    const safeProfile = authHelpers.sanitizeProfile(profile);
    const token = authHelpers.generateToken(safeProfile);

    // Fire-and-forget: Login notification
    notificationService.onLogin(profile.id, profile.email, profile.name).catch(() => {});

    return NextResponse.json({
      success: true,
      token,
      profile: safeProfile
    }, { status: 200 });
  } catch (err: any) {
    console.error('[AUTH LOGIN] Uncaught Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error occurred.' }, { status: 200 });
  }
}

