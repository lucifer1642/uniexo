import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 200 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.trim())
      .maybeSingle();

    if (profile) {
      // TODO: Generate a secure token, store it, and email it to the user
    }

    return NextResponse.json({ 
      success: true, 
      message: 'If an account with that email exists, a reset link has been sent.' 
    }, { status: 200 });
  } catch (err: any) {
    console.error('[AUTH FORGOT PASSWORD] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error occurred.' }, { status: 200 });
  }
}

