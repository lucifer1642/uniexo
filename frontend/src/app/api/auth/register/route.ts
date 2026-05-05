import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[API-REGISTER] Request body:', { ...body, password: '***' });
    
    const { 
      email, password, name, phone, role, 
      university_id, business_name, service_type, 
      onsite_pickup, store_delivery 
    } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.trim())
      .maybeSingle();

    if (checkError) {
      console.error('[API-REGISTER] Error checking existing user:', checkError);
    }

    if (existingUser) {
       console.log('[API-REGISTER] Conflict: User already exists:', existingUser.email);
       return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate simple UUID
    const id = crypto.randomUUID();

    // Use Admin Client to bypass RLS and perform Insert
    const profileData: any = {
        id,
        email: email.trim(),
        password_hash,
        role: role || 'user',
        name: name || email.split('@')[0],
        phone: phone || null,
        university_id: role === 'user' ? university_id : null,
        business_name: role === 'vendor' ? business_name : null,
        service_type: role === 'vendor' ? service_type : null,
        onsite_pickup: (role === 'vendor' && service_type === 'laundry') ? (onsite_pickup ? true : false) : null,
        on_store_service: (role === 'vendor' && service_type === 'laundry') ? (store_delivery ? true : false) : null,
        store_delivery: (role === 'vendor' && service_type === 'laundry') ? (store_delivery ? true : false) : null,
        kyc_status: 'none',
        updated_at: new Date().toISOString()
    };

    console.log('[API-REGISTER] Inserting profile for:', email);
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('[API-REGISTER] Database error during insert:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If laundry vendor, create corresponding laundry_services record
    if (role === 'vendor' && service_type === 'laundry') {
        try {
            console.log('[API-REGISTER] Creating laundry service for:', business_name);
            await supabaseAdmin.from('laundry_services').insert([{
                vendor_id: id,
                name: business_name || `${name}'s Laundry`,
                onsite_pickup: !!onsite_pickup,
                on_store_service: !!store_delivery,
                onsite_pickup_charge: 0,
                provider_name: name,
                provider_phone: phone
            }]);
        } catch (laundryErr) {
            console.error('[API-REGISTER] Non-fatal error creating laundry service:', laundryErr);
            // We don't return error here to let the signup finish
        }
    }

    // 10-year expiry for permanent sessions
    const TEN_YEARS = 10 * 365 * 24 * 60 * 60 * 1000;
    const token = Buffer.from(JSON.stringify({ userId: data.id, role: data.role, exp: Date.now() + TEN_YEARS })).toString('base64');
    
    // Remove hash from response
    const { password_hash: _hash, ...safeProfile } = data;

    console.log('[API-REGISTER] Registration successful for:', email);
    return NextResponse.json({ success: true, token, profile: safeProfile });
  } catch (err: any) {
    console.error('[API-REGISTER] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
