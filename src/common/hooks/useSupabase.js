import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
  )
}

/**
 * Singleton Supabase client instance.
 * Import this directly instead of calling createClient() multiple times.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so it survives page reloads and PWA restarts
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * Hook wrapper — returns the singleton client.
 * Use this in components so the import reads naturally:
 *   const supabase = useSupabase()
 */
export function useSupabase() {
  return supabase
}
