import { createBrowserClient } from '@supabase/ssr'

// createBrowserClient (not plain createClient) stores the session in cookies
// instead of localStorage, so proxy.ts can read the session on the server and
// actually gate /dashboard/* — a plain localStorage session is invisible to
// server-side code.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Parse the session out of the URL after email-confirmation / OAuth
      // redirects (tokens arrive in the hash fragment with the implicit flow).
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  }
)
