/**
 * Whether real Supabase credentials are present. Every Supabase client
 * factory in this app checks this first and returns `null` instead of
 * throwing, so pages render a friendly "backend not configured" state
 * instead of crashing when `.env.local` hasn't been filled in yet.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}
