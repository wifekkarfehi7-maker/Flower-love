import type { Metadata } from "next";

import { AdminSubscriptionsView, type AdminSubscriptionRow } from "@/components/admin/admin-subscriptions-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/types/database";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].admin.subscriptions,
  robots: { index: false },
};

export default async function AdminSubscriptionsPage() {
  const supabase = getSupabaseServerClient();

  let plans: SubscriptionPlan[] = [];
  let breakdown: { planCode: string; planName: string; restaurants: number; active: number }[] = [];
  let rows: AdminSubscriptionRow[] = [];

  if (supabase) {
    const [plansResult, breakdownResult, restaurantsResult] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("sort_order", { ascending: true }),
      supabase.rpc("admin_subscription_breakdown"),
      supabase.rpc("admin_restaurants", { p_search: null, p_status: null, p_limit: 100, p_offset: 0 }),
    ]);

    plans = plansResult.data ?? [];
    breakdown = (breakdownResult.data ?? []).map((entry) => ({
      planCode: entry.plan_code,
      planName: entry.plan_name_en,
      restaurants: Number(entry.restaurants ?? 0),
      active: Number(entry.active ?? 0),
    }));

    const planByCode = new Map(plans.map((plan) => [plan.code, plan]));
    rows = (restaurantsResult.data ?? []).map((row) => ({
      restaurantId: row.id,
      restaurantName: row.name,
      slug: row.slug,
      planCode: row.plan_code,
      planName: row.plan_code ? (planByCode.get(row.plan_code)?.name_en ?? null) : null,
      status: row.subscription_status,
      periodEnd: null,
    }));
  }

  return <AdminSubscriptionsView plans={plans} breakdown={breakdown} rows={rows} />;
}
