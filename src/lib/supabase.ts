import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxxxxx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

if (supabaseUrl === 'https://xxxxxx.supabase.co') {
  console.warn(
    'Supabase environment variables not set. Using placeholder URL to prevent crash.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
