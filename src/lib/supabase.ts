import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.trim();

// Check if credentials exist and are not unreplaced placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== '' &&
  supabaseAnonKey !== '' &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon-key') &&
  supabaseUrl.startsWith('http')
);

export function getSupabaseConfigStatus(): { configured: boolean; message: string | null } {
  if (isSupabaseConfigured) {
    return { configured: true, message: null };
  }

  const missing: string[] = [];
  if (!supabaseUrl || supabaseUrl.includes('your-project-id') || !supabaseUrl.startsWith('http')) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes('your-supabase-anon-key')) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  return {
    configured: false,
    message: `Missing or incomplete Supabase configuration: ${missing.join(', ')}. Set these environment variables in your .env file to enable live authentication.`,
  };
}

// Create the Supabase client safely. If not configured, instantiate with a dummy URL to prevent bundle failure
// while guarding calls through `isSupabaseConfigured`.
const clientUrl = isSupabaseConfigured && supabaseUrl ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured && supabaseAnonKey ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(
  clientUrl,
  clientKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
