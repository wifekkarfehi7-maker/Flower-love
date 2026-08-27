"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logAdminAction } from "./log-action";
import type { UserRole } from "@/types/database";

export type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string };
function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}
function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
const NOT_CONFIGURED = "not_configured";

/** Promotes/demotes a user's role. Refuses to let an admin demote themselves (avoids accidental lockout). */
export async function setUserRole(userId: string, role: UserRole): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("not_authenticated");
  if (user.id === userId && role !== "admin") return fail("cannot_demote_self");

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return fail(error.message);

  await logAdminAction(supabase, role === "admin" ? "promote_to_admin" : "demote_to_customer", "user", userId);
  return ok(null);
}
