import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name, phone, role, university_id, business_name, service_type } = body;

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use Admin Client to bypass RLS and perform Upsert
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id,
        email,
        name,
        phone,
        role,
        university_id,
        business_name,
        service_type,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[API-REGISTER] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-confirm user email so they can log in immediately
    await supabaseAdmin.auth.admin.updateUserById(id, { 
      email_confirm: true 
    });

    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    console.error('[API-REGISTER] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
