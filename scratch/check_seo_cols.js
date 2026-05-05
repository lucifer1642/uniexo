const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const tables = ['houses', 'vehicles', 'marketplace_items', 'laundry_services'];
  for (const table of tables) {
    const { data: cols, error: colErr } = await supabase.from(table).select('*').limit(1);
    if (colErr) console.error(`Error on ${table}:`, colErr.message);
    else console.log(`${table} columns:`, Object.keys(cols[0] || {}));
  }
}

checkColumns();
