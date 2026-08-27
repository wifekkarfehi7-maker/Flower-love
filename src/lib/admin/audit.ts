import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AuditLogRow } from "@/types/database";

export interface AdminAuditEntry extends AuditLogRow {
  adminName: string | null;
}

/** Recent admin actions, newest first, with the acting admin's name joined in. */
export async function listAuditLog(limit = 100): Promise<AdminAuditEntry[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const adminIds = [...new Set(data.map((e) => e.admin_id).filter((id): id is string => Boolean(id)))];
  const { data: admins } = adminIds.length > 0 ? await supabase.from("profiles").select("*").in("id", adminIds) : { data: [] };
  const adminMap = new Map((admins ?? []).map((a) => [a.id, a.full_name]));

  return data.map((entry) => ({ ...entry, adminName: entry.admin_id ? (adminMap.get(entry.admin_id) ?? null) : null }));
}
