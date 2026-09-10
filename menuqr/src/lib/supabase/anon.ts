import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Cookie-free client for public menu reads. Because it never touches cookies,
 * the public menu page stays statically renderable and cacheable — which is
 * the difference between a fast and a slow first paint for a guest on mobile
 * data who just scanned a code. It sees exactly what the `anon` role is
 * allowed to see under RLS.
 */
export function getSupabaseAnonClient() {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return cached;
}
