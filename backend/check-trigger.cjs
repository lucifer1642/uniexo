const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/lpuc1/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_function_definition', { func_name: 'handle_new_user' });
  if (error) {
    console.log("RPC Error:", error);
    // try direct query if rpc doesn't exist to see if we can get a vendor record
    const { data: vData, error: vErr } = await supabase.from('users').select('*').eq('role', 'vendor').limit(1);
    console.log("Vendor data:", vData);
  } else {
    console.log(data);
  }
}
check();
