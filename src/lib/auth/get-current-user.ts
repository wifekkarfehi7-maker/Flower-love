import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

/**
 * Server-side auth lookup for layouts/pages. Uses `getUser()` (not
 * `getSession()`) because it re-validates the JWT against Supabase Auth
 * rather than trusting whatever is in the cookie.
 */
export async function getCurrentUserAndProfile() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { user: null, profile: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  return { user, profile: profile ?? null };
}
