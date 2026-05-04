const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/lpuc1/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'vendor').order('created_at', { ascending: false }).limit(3);
  console.log("Profiles:", data);
  const { data: vData, error: vErr } = await supabase.from('vendor_profiles').select('*').order('created_at', { ascending: false }).limit(3);
  console.log("Vendor Profiles:", vData);
}
check();
