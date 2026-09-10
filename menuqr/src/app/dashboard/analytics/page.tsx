import type { Metadata } from "next";

import { AnalyticsView } from "@/components/analytics/analytics-view";
import { loadAnalytics } from "@/lib/analytics/queries";
import { EMPTY_ANALYTICS } from "@/lib/analytics/types";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].analytics.title,
  robots: { index: false },
};

const DEFAULT_DAYS = 30;

export default async function AnalyticsPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  const data = active && supabase ? await loadAnalytics(supabase, active.id, DEFAULT_DAYS) : EMPTY_ANALYTICS;

  return <AnalyticsView initialData={data} initialDays={DEFAULT_DAYS} />;
}
