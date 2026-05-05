const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAuth() {
  const email = 'uniexo.in@gmail.com';

  console.log('1. Checking profile in DB for:', email);
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchError || !profile) {
    console.error('Error fetching profile:', fetchError);
    return;
  }
  
  console.log('Profile found:', profile.id);

  console.log('\n2. Simulating Token Generation (Frontend)');
  const tokenPayload = { userId: profile.id, role: profile.role, exp: Date.now() + 86400000 };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  console.log('Generated Token:', token);

  console.log('\n3. Simulating Backend Auth Middleware');
  let decodedToken;
  try {
      decodedToken = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      console.log('Decoded Token Payload:', decodedToken);
  } catch (e) {
      console.error('Failed to decode token');
      return;
  }

  const { data: verifiedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, role, name, is_deleted, is_suspended')
      .eq('id', decodedToken.userId)
      .maybeSingle();

  if (verifyError || !verifiedProfile) {
    console.error('Middleware Verification Failed:', verifyError);
  } else {
    console.log('Middleware Verification Success:', verifiedProfile.email);
  }
}

debugAuth();
