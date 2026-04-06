import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseEnabled) {
  console.warn(
    '[supabaseClient] Supabase tidak dikonfigurasi: pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ada di file .env'
  );
} else {
  console.debug('[supabaseClient] Supabase config loaded', { supabaseUrl, hasAnonKey: Boolean(supabaseAnonKey) });
}

export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-key'
);
