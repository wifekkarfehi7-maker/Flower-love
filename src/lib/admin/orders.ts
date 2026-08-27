import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { InvitationRow, OrderRow, OrderStatus, PaymentRow, ProfileRow } from "@/types/database";

export interface AdminOrderSummary extends OrderRow {
  invitationCoupleNames: string;
  invitationSlug: string | null;
}

/** All orders (optionally filtered by status), newest first, with the invitation's couple names joined in. */
export async function listAdminOrders(statusFilter?: OrderStatus[]): Promise<AdminOrderSummary[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (statusFilter && statusFilter.length > 0) query = query.in("status", statusFilter);

  const { data: orders, error } = await query;
  if (error || !orders) return [];

  const invitationIds = [...new Set(orders.map((o) => o.invitation_id))];
  const { data: invitations } = await supabase.from("invitations").select("*").in("id", invitationIds);
  const invitationMap = new Map((invitations ?? []).map((i) => [i.id, i]));

  return orders.map((order) => {
    const invitation = invitationMap.get(order.invitation_id);
    return {
      ...order,
      invitationCoupleNames: invitation ? `${invitation.groom_name ?? ""} & ${invitation.bride_name ?? ""}` : "—",
      invitationSlug: invitation?.slug ?? null,
    };
  });
}

export interface AdminOrderDetail {
  order: OrderRow;
  invitation: InvitationRow;
  customerProfile: ProfileRow | null;
  payments: PaymentRow[];
}

/** Full detail for one order: the invitation it's for, the customer's profile, and any payment records. */
export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return null;

  const [{ data: invitation }, { data: customerProfile }, { data: payments }] = await Promise.all([
    supabase.from("invitations").select("*").eq("id", order.invitation_id).single(),
    supabase.from("profiles").select("*").eq("id", order.user_id).single(),
    supabase.from("payments").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
  ]);

  if (!invitation) return null;

  return { order, invitation, customerProfile: customerProfile ?? null, payments: payments ?? [] };
}
