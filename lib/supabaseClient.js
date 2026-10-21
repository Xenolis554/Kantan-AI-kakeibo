import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === '******') {
  throw new Error(
    'SupabaseのURLまたはAnon Keyが.env.localに正しく設定されていません。'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);