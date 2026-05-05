import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Find user by email
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password in DB
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[RESET-PASSWORD] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[RESET-PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
