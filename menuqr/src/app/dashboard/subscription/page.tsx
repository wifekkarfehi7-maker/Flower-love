import type { Metadata } from "next";

import { SubscriptionView, type SubscriptionUsage } from "@/components/subscription/subscription-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Subscription, SubscriptionPlan } from "@/types/database";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].subscription.title,
  robots: { index: false },
};

const EMPTY_USAGE: SubscriptionUsage = {
  categories: { used: 0, limit: null },
  products: { used: 0, limit: null },
  tables: { used: 0, limit: null },
  members: { used: 0, limit: null },
};

export default async function SubscriptionPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let plans: SubscriptionPlan[] = [];
  let subscription: Subscription | null = null;
  let currentPlan: SubscriptionPlan | null = null;
  let usage = EMPTY_USAGE;

  if (active && supabase) {
    const [plansResult, subscriptionResult, usageResult] = await Promise.all([
      supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("subscriptions").select("*").eq("restaurant_id", active.id).maybeSingle(),
      supabase.rpc("restaurant_usage", { p_restaurant: active.id }),
    ]);

    plans = plansResult.data ?? [];
    subscription = subscriptionResult.data ?? null;
    currentPlan = plans.find((plan) => plan.id === subscription?.plan_id) ?? null;

    const row = usageResult.data?.[0];
    if (row) {
      usage = {
        categories: { used: Number(row.categories_used ?? 0), limit: row.categories_limit },
        products: { used: Number(row.products_used ?? 0), limit: row.products_limit },
        tables: { used: Number(row.tables_used ?? 0), limit: row.tables_limit },
        members: { used: Number(row.members_used ?? 0), limit: row.members_limit },
      };
    }
  }

  return <SubscriptionView plans={plans} subscription={subscription} currentPlan={currentPlan} usage={usage} />;
}
