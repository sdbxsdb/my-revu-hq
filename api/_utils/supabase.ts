import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!supabaseClient) {
      supabaseClient = getSupabaseClient();
    }
    return (supabaseClient as any)[prop];
  },
});
