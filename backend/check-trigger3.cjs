const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/lpuc1/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}
check();
