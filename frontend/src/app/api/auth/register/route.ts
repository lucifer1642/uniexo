import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      email, password, name, phone, role, 
      university_id, business_name, service_type, 
      onsite_pickup, store_delivery 
    } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
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
        email,
        password_hash,
        role: role || 'user',
        name: name || email.split('@')[0],
        phone: phone || null,
        university_id: role === 'user' ? university_id : null,
        business_name: role === 'vendor' ? business_name : null,
        service_type: role === 'vendor' ? service_type : null,
        kyc_status: 'none',
        updated_at: new Date().toISOString()
    };

    if (role === 'vendor' && service_type === 'laundry') {
        profileData.onsite_pickup = onsite_pickup ? 1 : 0;
        profileData.store_delivery = store_delivery ? 1 : 0;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('[API-REGISTER] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If laundry vendor, create corresponding laundry_services record
    if (role === 'vendor' && service_type === 'laundry') {
        await supabaseAdmin.from('laundry_services').insert([{
            vendor_id: id,
            name: business_name || `${name}'s Laundry`,
            onsite_pickup: onsite_pickup,
            on_store_service: store_delivery,
            onsite_pickup_charge: 0,
            provider_name: name,
            provider_phone: phone
        }]);
    }

    const token = Buffer.from(JSON.stringify({ userId: data.id, role: data.role, exp: Date.now() + 86400000 })).toString('base64');
    
    // Remove hash from response
    const { password_hash: _hash, ...safeProfile } = data;

    return NextResponse.json({ success: true, token, profile: safeProfile });
  } catch (err: any) {
    console.error('[API-REGISTER] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
