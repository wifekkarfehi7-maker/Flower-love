import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

/** Supabase client for Server Components, Server Actions and Route Handlers. */
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component render — cookies are read-only there; the
          // middleware refreshes the session instead.
        }
      },
    },
  });
}
