import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from frontend/.env.local
dotenv.config({ path: path.resolve('frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndClean() {
  console.log('Checking profiles...');
  const { data, error, count } = await supabase
    .from('profiles')
    .select('id, email', { count: 'exact' });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Current profile count: ${count}`);
  if (data && data.length > 0) {
    console.log('Sample emails:', data.map(p => p.email).join(', '));
  }

  // If the user wants to clean, they should probably run this:
  // await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // but I'll wait for user to confirm or just provide the SQL.
}

checkAndClean();
