import type { Metadata } from "next";

import { OverviewView, type OverviewData } from "@/components/dashboard/overview-view";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].dashboard.overview,
  robots: { index: false },
};

const EMPTY: OverviewData = {
  viewsToday: 0,
  scansToday: 0,
  viewsWeek: 0,
  productCount: 0,
  categoryCount: 0,
  tableCount: 0,
  recentViews: [],
};

async function loadOverview(restaurantId: string): Promise<OverviewData> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return EMPTY;

  const [summary, products, categories, tables, recent] = await Promise.all([
    supabase.rpc("restaurant_analytics_summary", { p_restaurant: restaurantId }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .is("deleted_at", null),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .is("deleted_at", null),
    supabase
      .from("restaurant_tables")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .is("deleted_at", null),
    supabase
      .from("menu_views")
      .select("id, viewed_at, source, restaurant_tables:table_id (name)")
      .eq("restaurant_id", restaurantId)
      .order("viewed_at", { ascending: false })
      .limit(8),
  ]);

  const stats = summary.data?.[0];

  return {
    viewsToday: Number(stats?.views_today ?? 0),
    scansToday: Number(stats?.scans_today ?? 0),
    viewsWeek: Number(stats?.views_week ?? 0),
    productCount: products.count ?? 0,
    categoryCount: categories.count ?? 0,
    tableCount: tables.count ?? 0,
    recentViews: (recent.data ?? []).map((row) => ({
      id: row.id,
      viewed_at: row.viewed_at,
      source: row.source,
      tableName: (row.restaurant_tables as unknown as { name: string } | null)?.name ?? null,
    })),
  };
}

export default async function DashboardPage() {
  const [{ profile }, { active }] = await Promise.all([getCurrentUser(), getRestaurantContext()]);
  const data = active ? await loadOverview(active.id) : EMPTY;

  return <OverviewView data={data} ownerName={profile?.full_name ?? null} />;
}
