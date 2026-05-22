import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authHelpers } from '@/modules/auth/auth.helpers';

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ success: false, error: 'Email and new password are required' }, { status: 200 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 200 });
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (fetchError || !profile) {
      return NextResponse.json({ success: false, error: 'Account not found or link expired.' }, { status: 200 });
    }

    const password_hash = await authHelpers.hashPassword(newPassword);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[AUTH RESET] Update error:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update password. Please try again.' }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[AUTH RESET] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error occurred.' }, { status: 200 });
  }
}

