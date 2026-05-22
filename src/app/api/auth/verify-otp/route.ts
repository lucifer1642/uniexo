import { NextResponse } from 'next/server';
import { otpService } from '@/modules/email/otp.service';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authHelpers } from '@/modules/auth/auth.helpers';

export async function POST(req: Request) {
  try {
    const { email, otp, purpose } = await req.json();
    if (!email || !otp) return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 200 });

    const result = await otpService.verifyOtp(email, otp, purpose || 'signup');
    if (!result.success) {
      return NextResponse.json(result, { status: 200 });
    }

    // If purpose is signup, return a token so the user gets auto-logged in
    if (purpose === 'signup' || !purpose) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email.trim())
        .maybeSingle();

      if (profile) {
        const safeProfile = authHelpers.sanitizeProfile(profile);
        const token = authHelpers.generateToken(safeProfile);
        return NextResponse.json({ success: true, token, profile: safeProfile }, { status: 200 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API VERIFY-OTP] Error:', err);
    return NextResponse.json({ success: false, error: 'Verification failed.' }, { status: 200 });
  }
}
