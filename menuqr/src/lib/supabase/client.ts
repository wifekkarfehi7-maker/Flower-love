"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser client for Client Components. All tenant isolation is enforced by
 * RLS on the database side, so this client only ever holds the anon key plus
 * the signed-in user's session.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return cached;
}
