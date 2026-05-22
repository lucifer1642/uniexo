import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── LAZY INITIALIZATION ──────────────────────────────────────
// Supabase client is created on first use, NOT at module load time.
// This prevents cold-start hangs on Vercel serverless functions
// when environment variables haven't been injected yet.

let _client: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[SUPABASE-ADMIN] Missing environment variables!');
    console.error('[SUPABASE-ADMIN] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('[SUPABASE-ADMIN] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
    throw new Error('Supabase environment variables are not configured.');
  }

  console.log('[SUPABASE-ADMIN] Creating Supabase client...');
  _client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('[SUPABASE-ADMIN] Client created successfully');

  return _client;
}

// Export as a getter so it's lazily initialized
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
