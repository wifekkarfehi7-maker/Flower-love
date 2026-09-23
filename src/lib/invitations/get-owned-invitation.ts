import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { InvitationRow, OrderRow, OrderStatus } from "@/types/database";

/** Order statuses that keep a plan's features on (mirrors `public.invitation_has_premium`). */
const LIVE_ORDER_STATUSES: OrderStatus[] = ["pending_payment", "payment_review", "paid", "active"];

export interface OwnedInvitation {
  invitation: InvitationRow;
  /** The invitation's most recent live order, if any. */
  order: OrderRow | null;
  /** True when that order is for the Premium plan: custom URL, QR code, detailed analytics. */
  isPremium: boolean;
}

/**
 * Loads an invitation for its owner (or an admin) together with the plan it
 * was ordered on. Returns null when it doesn't exist or isn't theirs.
 */
export async function getOwnedInvitation(
  invitationId: string,
  userId: string,
  isAdmin = false
): Promise<OwnedInvitation | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: invitation } = await supabase.from("invitations").select("*").eq("id", invitationId).maybeSingle();
  if (!invitation || (invitation.user_id !== userId && !isAdmin)) return null;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("invitation_id", invitationId)
    .in("status", LIVE_ORDER_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let isPremium = false;
  if (order?.plan_id) {
    const { data: plan } = await supabase.from("pricing_plans").select("slug").eq("id", order.plan_id).maybeSingle();
    isPremium = plan?.slug === "premium";
  }

  return { invitation, order: order ?? null, isPremium };
}
