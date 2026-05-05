const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  const email = 'uniexo.in@gmail.com';
  const password = 'Uniexo@26';
  const role = 'admin';

  console.log(`Seeding Admin: ${email}`);

  // 1. Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // 2. Insert into profiles
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      email: email,
      password_hash: password_hash,
      role: role,
      name: 'Super Admin',
      kyc_status: 'approved',
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' })
    .select();

  if (error) {
    console.error('Error seeding admin:', error);
  } else {
    console.log('✅ Admin seeded successfully:', data[0].email);
  }
}

seedAdmin();
