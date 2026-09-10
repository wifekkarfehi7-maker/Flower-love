"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n/types";
import { getVisitorSession } from "@/lib/analytics/session";

export interface OrderLine {
  productId: string;
  quantity: number;
  optionIds: string[];
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "served" | "cancelled";

/**
 * Sends an order the only way a guest can: one SECURITY DEFINER function that
 * prices the lines from the venue's own menu. Nothing here is trusted by the
 * server, so the payload deliberately carries no prices — sending them would
 * only invite the reader to think they matter.
 */
export async function placeOrder(options: {
  restaurantId: string;
  tableId: string | null;
  lines: OrderLine[];
  note: string;
}): Promise<{ orderId: string } | { error: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "NOT_CONFIGURED" };

  const { data, error } = await supabase.rpc("place_order", {
    p_restaurant: options.restaurantId,
    p_session: getVisitorSession(),
    p_items: options.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
      options: line.optionIds,
    })),
    p_table: options.tableId,
    p_note: options.note.trim() || null,
  });

  if (error) return { error: error.message };
  if (!data) return { error: "UNKNOWN" };
  return { orderId: data as string };
}

export async function readOrderStatus(orderId: string): Promise<OrderStatus | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data } = await supabase.rpc("order_status_for_session", {
    p_order: orderId,
    p_session: getVisitorSession(),
  });

  return (data?.[0]?.status as OrderStatus | undefined) ?? null;
}

/**
 * The database raises named errors so the guest can be told what to do about
 * it — a dish that sold out while they were reading is not the same problem as
 * a venue that never took orders.
 */
export function orderErrorMessage(raw: string, t: Dictionary): string {
  if (raw.includes("PRODUCT_SOLD_OUT")) return t.menu.orderSoldOut;
  if (raw.includes("ORDERING_DISABLED")) return t.menu.orderDisabled;
  if (raw.includes("VENUE_NOT_AVAILABLE")) return t.menu.orderDisabled;
  if (raw.includes("TOO_MANY_ORDERS")) return t.menu.orderTooMany;
  if (raw.includes("EMPTY_ORDER")) return t.menu.cartEmpty;
  return t.errors.serverErrorText;
}
