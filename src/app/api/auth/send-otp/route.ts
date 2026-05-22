import { NextResponse } from 'next/server';
import { otpService } from '@/modules/email/otp.service';

export async function POST(req: Request) {
  try {
    const { email, purpose } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: 'Email is required' }, { status: 200 });

    const result = await otpService.sendOtp(email, purpose || 'signup');
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API SEND-OTP] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to send OTP.' }, { status: 200 });
  }
}
