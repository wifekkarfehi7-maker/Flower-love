import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { InvitationRow, InvitationStatus } from "@/types/database";

export interface AdminInvitationSummary extends InvitationRow {
  ownerName: string | null;
  ownerWhatsapp: string | null;
}

/** Every invitation on the platform (optionally filtered by status), with the owner's profile joined in. */
export async function listAdminInvitations(statusFilter?: InvitationStatus[]): Promise<AdminInvitationSummary[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase.from("invitations").select("*").order("created_at", { ascending: false });
  if (statusFilter && statusFilter.length > 0) query = query.in("status", statusFilter);

  const { data: invitations, error } = await query;
  if (error || !invitations) return [];

  const userIds = [...new Set(invitations.map((i) => i.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return invitations.map((invitation) => {
    const owner = profileMap.get(invitation.user_id);
    return { ...invitation, ownerName: owner?.full_name ?? null, ownerWhatsapp: owner?.whatsapp ?? null };
  });
}
