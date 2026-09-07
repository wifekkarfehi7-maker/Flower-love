/**
 * The app is usable before Supabase is configured: every entry point checks
 * isSupabaseConfigured() and renders a "backend not configured" state instead
 * of throwing, which keeps `next build` and a fresh clone working.
 */
export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
