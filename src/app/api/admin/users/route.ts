import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req, user) => {
  if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    
    let query = supabaseAdmin.from('profiles').select('*');
    if (role && role !== 'all') query = query.eq('role', role);
    if (search) query = query.ilike('name', `%${search}%`);
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ success: true, data: { data } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});