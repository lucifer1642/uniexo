const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDB() {
  console.log('Cleaning Database...');
  
  // Delete in order to handle foreign keys if cascades aren't set
  console.log('Cleaning bookings...');
  await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Cleaning laundry_services...');
  await supabase.from('laundry_services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Cleaning vendor_profiles...');
  await supabase.from('vendor_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Cleaning profiles...');
  const { error } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error cleaning profiles:', error);
  } else {
    console.log('✅ Database cleaned successfully! All profiles and related data removed.');
  }
}

cleanDB();
