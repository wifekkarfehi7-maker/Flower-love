import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PricingPlanRecord } from "@/types/invitation";
import type { PricingPlanRow } from "@/types/database";
import { STATIC_PRICING_PLANS } from "./static-plans";

function mapRow(row: PricingPlanRow): PricingPlanRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.name_ar,
    price: row.price,
    currency: row.currency,
    period: row.period,
    description: row.description,
    features: row.features,
    isWatermarked: row.is_watermarked,
    sortOrder: row.sort_order,
  };
}

/** All active pricing plans, sorted for display. Falls back to static data if Supabase isn't configured. */
export async function getActivePricingPlans(): Promise<PricingPlanRecord[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [...STATIC_PRICING_PLANS].sort((a, b) => a.sortOrder - b.sortOrder);

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return [...STATIC_PRICING_PLANS].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return data.map(mapRow);
}

/** All pricing plans regardless of active status, for the admin dashboard. Empty (not the static fallback) when Supabase isn't configured. */
export async function getAllPricingPlansForAdmin(): Promise<PricingPlanRecord[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("pricing_plans").select("*").order("sort_order", { ascending: true });
  if (error || !data) return [];

  return data.map(mapRow);
}

/** A single pricing plan by id, falling back to static data. */
export async function getPricingPlanById(id: string): Promise<PricingPlanRecord | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return STATIC_PRICING_PLANS.find((p) => p.id === id) ?? null;

  const { data, error } = await supabase.from("pricing_plans").select("*").eq("id", id).single();

  if (error || !data) {
    return STATIC_PRICING_PLANS.find((p) => p.id === id) ?? null;
  }

  return mapRow(data);
}
