import type { User } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface CurrentUser {
  user: User | null;
  profile: Profile | null;
}

/** Server-side session + profile. `getUser()` validates the JWT with Supabase. */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { user: null, profile: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return { user, profile: profile ?? null };
}
