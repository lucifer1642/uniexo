import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// We use the Service Role Key in the backend to bypass RLS and perform administrative tasks
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
