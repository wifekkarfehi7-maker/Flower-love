"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrderRow } from "@/types/database";

export type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string };

function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}
function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
const NOT_CONFIGURED = "not_configured";

export interface CreateOrderInput {
  userId: string;
  invitationId: string;
  planId: string | null;
  customerName: string;
  customerWhatsapp: string;
  planName: string;
  price: number;
  currency: string;
}

/**
 * Creates a real order row for an invitation and moves the invitation to
 * `pending_payment` — the customer then confirms via WhatsApp; an admin
 * reviews and activates it (Phase 8).
 */
export async function createOrder(input: CreateOrderInput): Promise<ActionResult<OrderRow>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      invitation_id: input.invitationId,
      plan_id: input.planId,
      customer_name: input.customerName,
      customer_whatsapp: input.customerWhatsapp,
      plan_name: input.planName,
      price: input.price,
      currency: input.currency,
      status: "pending_payment",
    })
    .select("*")
    .single();

  if (error || !data) return fail(error?.message ?? "insert_failed");

  await supabase.from("invitations").update({ status: "pending_payment" }).eq("id", input.invitationId);

  return ok(data);
}

/** The most recent order for an invitation, if one exists. */
export async function getOrderForInvitation(invitationId: string): Promise<ActionResult<OrderRow | null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return error ? fail(error.message) : ok(data ?? null);
}
