import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('settlements')
      .select('*, profiles:vendor_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
