import type { Metadata } from "next";

import { AdminOverview, type PlatformStats } from "@/components/admin/admin-overview";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].admin.overview,
  robots: { index: false },
};

const EMPTY: PlatformStats = {
  totalRestaurants: 0,
  activeRestaurants: 0,
  suspendedRestaurants: 0,
  newRestaurantsMonth: 0,
  totalUsers: 0,
  newUsersMonth: 0,
  totalQrCodes: 0,
  totalMenuViews: 0,
  menuViewsMonth: 0,
  totalProducts: 0,
  totalTables: 0,
};

export default async function AdminOverviewPage() {
  const supabase = getSupabaseServerClient();
  let stats = EMPTY;
  let breakdown: { planCode: string; planName: string; restaurants: number; active: number }[] = [];

  if (supabase) {
    const [statsResult, breakdownResult] = await Promise.all([
      supabase.rpc("admin_platform_stats"),
      supabase.rpc("admin_subscription_breakdown"),
    ]);

    const row = statsResult.data?.[0];
    if (row) {
      stats = {
        totalRestaurants: Number(row.total_restaurants ?? 0),
        activeRestaurants: Number(row.active_restaurants ?? 0),
        suspendedRestaurants: Number(row.suspended_restaurants ?? 0),
        newRestaurantsMonth: Number(row.new_restaurants_month ?? 0),
        totalUsers: Number(row.total_users ?? 0),
        newUsersMonth: Number(row.new_users_month ?? 0),
        totalQrCodes: Number(row.total_qr_codes ?? 0),
        totalMenuViews: Number(row.total_menu_views ?? 0),
        menuViewsMonth: Number(row.menu_views_month ?? 0),
        totalProducts: Number(row.total_products ?? 0),
        totalTables: Number(row.total_tables ?? 0),
      };
    }

    breakdown = (breakdownResult.data ?? []).map((entry) => ({
      planCode: entry.plan_code,
      planName: entry.plan_name_en,
      restaurants: Number(entry.restaurants ?? 0),
      active: Number(entry.active ?? 0),
    }));
  }

  return <AdminOverview stats={stats} breakdown={breakdown} />;
}
