import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { access_token } = await req.json();

    if (!access_token) {
      return NextResponse.json({ success: false, error: 'No access token provided' }, { status: 400 });
    }

    // Lazy load supabase to prevent cold starts
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
    }

    // Initialize with service role if available to bypass RLS for UPSERT, otherwise anon
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // We must load authHelpers securely inside the route to generate uni_id
    const { authHelpers } = await import('@/modules/auth/auth.helpers');

    // Securely verify the token
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(access_token);
    
    if (verifyError || !user || !user.email) {
      console.error('[GOOGLE SYNC] Token verify error:', verifyError);
      return NextResponse.json({ success: false, error: 'Invalid Google session' }, { status: 401 });
    }

    const email = user.email.toLowerCase();
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
    const avatar = user.user_metadata?.avatar_url || '';

    // Check if profile exists
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('[GOOGLE SYNC] DB error fetching profile:', profileError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    // Create profile if doesn't exist
    if (!profile) {
      console.log('[GOOGLE SYNC] Creating new profile for:', email);
      
      const newUniId = await authHelpers.generateUniId();
      
      const newProfile = {
        id: user.id, // match the auth.users UUID
        uni_id: newUniId,
        email: email,
        name: name,
        role: 'user', // default role
        auth_provider: 'google',
        avatar_url: avatar,
      };

      const { data: insertedProfile, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select('*')
        .single();

      if (insertError) {
        console.error('[GOOGLE SYNC] Insert profile error:', insertError);
        return NextResponse.json({ success: false, error: 'Failed to create profile' }, { status: 500 });
      }
      profile = insertedProfile;
    } else {
      // If profile exists, ensure avatar and auth_provider are updated if needed
      if ((!profile.avatar_url && avatar) || profile.auth_provider !== 'google') {
        await supabase
          .from('profiles')
          .update({ avatar_url: avatar || profile.avatar_url, auth_provider: 'google' })
          .eq('id', profile.id);
        profile.avatar_url = avatar || profile.avatar_url;
        profile.auth_provider = 'google';
      }
    }

    // Account status checks
    if (profile.is_deleted) {
      return NextResponse.json({ success: false, error: 'Account deleted.' }, { status: 403 });
    }
    if (profile.is_suspended) {
      return NextResponse.json({ success: false, error: 'Account suspended.' }, { status: 403 });
    }

    // Build safe profile for token
    const safeProfile = {
      id: profile.id,
      uniId: profile.uni_id || '',
      name: profile.name || '',
      email: profile.email,
      phone: profile.phone || '',
      role: profile.role || 'user',
      authProvider: 'google',
      avatar: profile.avatar_url || '',
      universityId: profile.university_id || '',
      location: profile.location || '',
      kycStatus: profile.kyc_status || 'none',
      businessName: profile.business_name || '',
      serviceType: profile.service_type || '',
    };

    // Generate custom JWT (uniexo_token) exactly like login route
    console.log('[GOOGLE SYNC] Generating JWT token...');
    const crypto = await import('crypto');
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'uniexo-default-dev-secret';

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: safeProfile.id,
      uniId: safeProfile.uniId,
      role: safeProfile.role,
      email: safeProfile.email,
      name: safeProfile.name,
      iat: now,
      exp: now + 90 * 24 * 60 * 60, // 90 days
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', jwtSecret)
      .update(`${header}.${payloadB64}`)
      .digest('base64url');
    const token = `${header}.${payloadB64}.${signature}`;

    console.log('[GOOGLE SYNC] Sync successful for:', safeProfile.email);
    const response = NextResponse.json({ success: true, token, profile: safeProfile }, { status: 200 });
    
    // Set cookie for middleware/server-components parity
    response.cookies.set({
      name: 'uniexo_token',
      value: token,
      httpOnly: false, 
      path: '/',
      maxAge: 90 * 24 * 60 * 60, 
      sameSite: 'lax',
    });

    return response;

  } catch (err: any) {
    console.error('[GOOGLE SYNC] Uncaught Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
