import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zlevgxtfasvvwcbpbhmy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_v8NQfSk5jAEmv6FYfYiyNg_suvjESDg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
