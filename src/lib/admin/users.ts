import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export interface AdminUserSummary extends ProfileRow {
  invitationCount: number;
}

/** Every registered user, newest first, with their invitation count. */
export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: profiles, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error || !profiles) return [];

  const { data: invitations } = await supabase.from("invitations").select("*");
  const counts = new Map<string, number>();
  (invitations ?? []).forEach((i) => counts.set(i.user_id, (counts.get(i.user_id) ?? 0) + 1));

  return profiles.map((profile) => ({ ...profile, invitationCount: counts.get(profile.id) ?? 0 }));
}
