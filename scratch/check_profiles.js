const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
  const { data: cols, error: colErr } = await supabase.from('profiles').select('*').limit(1);
  if (colErr) console.error(`Error:`, colErr.message);
  else console.log(`Profiles columns:`, Object.keys(cols[0] || {}));
}

checkProfiles();
