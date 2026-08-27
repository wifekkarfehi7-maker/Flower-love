"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logAdminAction } from "./log-action";
import type { PricingPlanRow } from "@/types/database";

export type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string };
function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}
function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
const NOT_CONFIGURED = "not_configured";

export interface PricingPlanInput {
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  isWatermarked: boolean;
  isActive: boolean;
  sortOrder: number;
}

function toRow(input: PricingPlanInput) {
  return {
    slug: input.slug,
    name: input.name,
    name_ar: input.nameAr,
    price: input.price,
    currency: input.currency,
    period: input.period,
    description: input.description,
    features: input.features,
    is_watermarked: input.isWatermarked,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };
}

export async function createPricingPlan(input: PricingPlanInput): Promise<ActionResult<PricingPlanRow>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { data, error } = await supabase.from("pricing_plans").insert(toRow(input)).select("*").single();
  if (error || !data) return fail(error?.message ?? "insert_failed");

  await logAdminAction(supabase, "create_pricing_plan", "pricing_plan", data.id, null, null, { slug: input.slug });
  return ok(data);
}

export async function updatePricingPlan(id: string, input: PricingPlanInput): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { error } = await supabase.from("pricing_plans").update(toRow(input)).eq("id", id);
  if (error) return fail(error.message);

  await logAdminAction(supabase, "update_pricing_plan", "pricing_plan", id, null, null, { slug: input.slug });
  return ok(null);
}

export async function togglePricingPlanActive(id: string, isActive: boolean): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { error } = await supabase.from("pricing_plans").update({ is_active: isActive }).eq("id", id);
  if (error) return fail(error.message);

  await logAdminAction(supabase, isActive ? "activate_pricing_plan" : "deactivate_pricing_plan", "pricing_plan", id);
  return ok(null);
}

export async function deletePricingPlan(id: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { error } = await supabase.from("pricing_plans").delete().eq("id", id);
  if (error) return fail(error.message);

  await logAdminAction(supabase, "delete_pricing_plan", "pricing_plan", id);
  return ok(null);
}
