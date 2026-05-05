import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists (don't reveal if they do or don't)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    // Always return success to avoid email enumeration
    // In production, you'd send an actual email with a reset token here
    if (profile) {
      console.log(`[FORGOT-PASSWORD] Reset requested for ${email} (user exists)`);
      // TODO: Generate a secure token, store it, and email it to the user
    } else {
      console.log(`[FORGOT-PASSWORD] Reset requested for ${email} (user NOT found)`);
    }

    return NextResponse.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err: any) {
    console.error('[FORGOT-PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
