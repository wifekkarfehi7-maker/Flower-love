"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildSlugCandidate } from "@/lib/invitations/slug";
import { logAdminAction } from "./log-action";
import type { InvitationRow, OrderRow } from "@/types/database";

export type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string };
function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}
function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
const NOT_CONFIGURED = "not_configured";

/** Marks an order (and its invitation) as paid, and records a confirmed payment. */
export async function confirmOrderPayment(order: OrderRow): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("not_authenticated");

  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id);
  if (orderError) return fail(orderError.message);

  await supabase.from("invitations").update({ status: "paid" }).eq("id", order.invitation_id);

  await supabase.from("payments").insert({
    order_id: order.id,
    amount: order.price,
    currency: order.currency,
    status: "confirmed",
    confirmed_by: user.id,
    confirmed_at: new Date().toISOString(),
  });

  await logAdminAction(supabase, "confirm_payment", "order", order.id, order.status, "paid");
  return ok(null);
}

/**
 * Activates an order's invitation: generates a public slug if it doesn't
 * have one yet, publishes it, clears the watermark, and marks the order
 * active. Retries slug generation on a rare unique-constraint collision.
 */
export async function activateOrder(order: OrderRow, invitation: InvitationRow): Promise<ActionResult<{ slug: string }>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const patch = {
    status: "active" as const,
    published_at: new Date().toISOString(),
    is_watermarked: false,
  };

  let finalSlug = invitation.slug;
  if (!finalSlug) {
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 5 && !finalSlug; attempt++) {
      const candidate = buildSlugCandidate(invitation.groom_name, invitation.bride_name);
      const { error } = await supabase
        .from("invitations")
        .update({ ...patch, slug: candidate })
        .eq("id", invitation.id);
      if (!error) {
        finalSlug = candidate;
        break;
      }
      if (error.code !== "23505") return fail(error.message);
      lastError = error.message;
    }
    if (!finalSlug) return fail(lastError ?? "slug_generation_failed");
  } else {
    const { error } = await supabase.from("invitations").update(patch).eq("id", invitation.id);
    if (error) return fail(error.message);
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "active", activated_at: new Date().toISOString() })
    .eq("id", order.id);
  if (orderError) return fail(orderError.message);

  await logAdminAction(supabase, "activate_invitation", "order", order.id, order.status, "active", { slug: finalSlug });
  return ok({ slug: finalSlug });
}

/** Cancels an order and reverts its invitation to draft so the customer can re-order. */
export async function cancelOrder(order: OrderRow, reason: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", admin_notes: reason || null })
    .eq("id", order.id);
  if (error) return fail(error.message);

  await supabase.from("invitations").update({ status: "draft" }).eq("id", order.invitation_id);

  await logAdminAction(supabase, "cancel_order", "order", order.id, order.status, "cancelled", { reason });
  return ok(null);
}
