import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listAdminOrders, type AdminOrderSummary } from "./orders";

export interface AdminOverview {
  totalUsers: number;
  totalInvitations: number;
  activeInvitations: number;
  pendingOrdersCount: number;
  revenueThisMonth: number;
  recentOrders: AdminOrderSummary[];
}

/** KPI summary for the admin overview page. */
export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = getSupabaseServerClient();
  const empty: AdminOverview = {
    totalUsers: 0,
    totalInvitations: 0,
    activeInvitations: 0,
    pendingOrdersCount: 0,
    revenueThisMonth: 0,
    recentOrders: [],
  };
  if (!supabase) return empty;

  const [{ count: totalUsers }, { count: totalInvitations }, { count: activeInvitations }, allOrders] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("invitations").select("*", { count: "exact", head: true }),
      supabase.from("invitations").select("*", { count: "exact", head: true }).eq("status", "active"),
      listAdminOrders(),
    ]);

  const pendingOrdersCount = allOrders.filter(
    (o) => o.status === "pending_payment" || o.status === "payment_review"
  ).length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenueThisMonth = allOrders
    .filter((o) => {
      if (o.status !== "paid" && o.status !== "active") return false;
      const recognizedAt = new Date(o.paid_at ?? o.activated_at ?? o.created_at);
      return recognizedAt >= monthStart;
    })
    .reduce((sum, o) => sum + Number(o.price), 0);

  return {
    totalUsers: totalUsers ?? 0,
    totalInvitations: totalInvitations ?? 0,
    activeInvitations: activeInvitations ?? 0,
    pendingOrdersCount,
    revenueThisMonth,
    recentOrders: allOrders.slice(0, 8),
  };
}
