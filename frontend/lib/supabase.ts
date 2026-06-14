import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client (uses anon key — NOT service role)
// Use this in all client components and hooks.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for convenience — import this in components
export const supabase = createClient();
