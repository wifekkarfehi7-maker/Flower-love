import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { EMPTY_ANALYTICS, type AnalyticsBundle } from "./types";

/**
 * All five reports in one round trip. The functions run as the caller, so RLS
 * on menu_views / menu_interactions is what keeps one venue's numbers out of
 * another venue's dashboard.
 */
export async function loadAnalytics(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  days: number
): Promise<AnalyticsBundle> {
  const [summary, timeseries, topProducts, topCategories, tableActivity] = await Promise.all([
    supabase.rpc("restaurant_analytics_summary", { p_restaurant: restaurantId }),
    supabase.rpc("restaurant_views_timeseries", { p_restaurant: restaurantId, p_days: days }),
    supabase.rpc("restaurant_top_products", { p_restaurant: restaurantId, p_days: days, p_limit: 6 }),
    supabase.rpc("restaurant_top_categories", { p_restaurant: restaurantId, p_days: days, p_limit: 6 }),
    supabase.rpc("restaurant_table_activity", { p_restaurant: restaurantId, p_days: days }),
  ]);

  const stats = summary.data?.[0];

  return {
    summary: stats
      ? {
          viewsToday: Number(stats.views_today ?? 0),
          viewsWeek: Number(stats.views_week ?? 0),
          viewsMonth: Number(stats.views_month ?? 0),
          viewsTotal: Number(stats.views_total ?? 0),
          scansToday: Number(stats.scans_today ?? 0),
          scansWeek: Number(stats.scans_week ?? 0),
          scansMonth: Number(stats.scans_month ?? 0),
          scansTotal: Number(stats.scans_total ?? 0),
          uniqueVisitorsMonth: Number(stats.unique_visitors_month ?? 0),
        }
      : EMPTY_ANALYTICS.summary,
    timeseries: (timeseries.data ?? []).map((row) => ({
      day: row.day,
      views: Number(row.views ?? 0),
      scans: Number(row.scans ?? 0),
    })),
    topProducts: (topProducts.data ?? []).map((row) => ({
      id: row.product_id,
      name_ar: row.name_ar,
      name_fr: row.name_fr,
      name_en: row.name_en,
      views: Number(row.views ?? 0),
    })),
    topCategories: (topCategories.data ?? []).map((row) => ({
      id: row.category_id,
      name_ar: row.name_ar,
      name_fr: row.name_fr,
      name_en: row.name_en,
      views: Number(row.views ?? 0),
    })),
    tableActivity: (tableActivity.data ?? []).map((row) => ({
      tableId: row.table_id,
      tableName: row.table_name,
      scans: Number(row.scans ?? 0),
      lastScan: row.last_scan,
    })),
  };
}
