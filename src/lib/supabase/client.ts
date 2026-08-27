"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

/**
 * Browser Supabase client for use inside Client Components. Returns `null`
 * when `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` aren't set
 * yet, so forms can show a friendly "backend not configured" state instead
 * of crashing.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
