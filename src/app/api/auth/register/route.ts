import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authHelpers } from '@/modules/auth/auth.helpers';
import { otpService } from '@/modules/email/otp.service';
import { notificationService } from '@/modules/email/notification.service';
import { OTP_ENABLED } from '@/modules/email/email.config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      email, password, name, phone, role, 
      university_id, business_name, service_type, 
      onsite_pickup, store_delivery 
    } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 200 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 200 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, auth_provider')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingUser) {
       if (existingUser.auth_provider === 'google') {
          return NextResponse.json({ success: false, error: 'This email is registered via Google. Please use Google Sign-In.' }, { status: 200 });
       }
       return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 200 });
    }

    const password_hash = await authHelpers.hashPassword(password);
    const id = crypto.randomUUID();
    const uni_id = await authHelpers.generateUniId();

    const profileData: any = {
        id,
        uni_id,
        email: email.trim().toLowerCase(),
        password_hash,
        auth_provider: 'email',
        role: role || 'user',
        name: name || email.split('@')[0],
        phone: phone || null,
        university_id: role === 'user' ? university_id : null,
        business_name: role === 'vendor' ? business_name : null,
        service_type: role === 'vendor' ? service_type : null,
        onsite_pickup: (role === 'vendor' && service_type === 'laundry') ? (onsite_pickup ? true : false) : null,
        on_store_service: (role === 'vendor' && service_type === 'laundry') ? (store_delivery ? true : false) : null,
        kyc_status: 'none',
        email_verified: !OTP_ENABLED,
        updated_at: new Date().toISOString()
    };

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('[AUTH REGISTER] DB Error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create account. Please try again.' }, { status: 200 });
    }

    // Vendor specific records
    if (role === 'vendor') {
        const { error: vendorErr } = await supabaseAdmin
          .from('vendor_profiles')
          .upsert({
            user_id: id,
            business_name: business_name || name || 'Vendor',
            service_type: service_type || 'ROOM',
            approval_status: 'approved',
            business_phone: phone || '',
            business_address: ''
          }, { onConflict: 'user_id' });

        if (vendorErr) {
          console.error('[AUTH REGISTER] Vendor Profile Error:', vendorErr);
        }

        if (service_type === 'laundry') {
            try {
              const { error: laundryErr } = await supabaseAdmin.from('laundry_services').insert([{
                  vendor_id: id,
                  name: business_name || `${name}'s Laundry`,
                  onsite_pickup: !!onsite_pickup,
                  on_store_service: !!store_delivery,
                  onsite_pickup_charge: 0,
                  provider_name: name,
                  provider_phone: phone
              }]);
              if (laundryErr) console.error('[AUTH REGISTER] Laundry Error:', laundryErr);
            } catch (e) {
              console.error('[AUTH REGISTER] Laundry Error:', e);
            }
        }
    }

    const safeProfile = authHelpers.sanitizeProfile(profile);
    const token = authHelpers.generateToken(safeProfile);

    // Fire-and-forget: Send OTP if enabled
    if (OTP_ENABLED) {
      otpService.sendOtp(email.trim(), 'signup').catch(() => {});
    }

    // Fire-and-forget: Welcome notification
    notificationService.onSignup(id, email.trim(), name || email.split('@')[0]).catch(() => {});

    return NextResponse.json({ 
      success: true, 
      token, 
      profile: safeProfile,
      otpRequired: OTP_ENABLED
    }, { status: 200 });
  } catch (err: any) {
    console.error('[AUTH REGISTER] Uncaught Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error occurred.' }, { status: 200 });
  }
}
