"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** Writes one audit_logs row via the log_admin_action RPC (the only way to insert there — see 0004_admin_audit.sql). */
export async function logAdminAction(
  supabase: SupabaseClient<Database>,
  action: string,
  targetType: string,
  targetId?: string | null,
  previousStatus?: string | null,
  newStatus?: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await supabase.rpc("log_admin_action", {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId ?? null,
    p_previous_status: previousStatus ?? null,
    p_new_status: newStatus ?? null,
    p_metadata: metadata,
  });
}
