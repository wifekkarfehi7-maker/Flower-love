import type { Metadata } from "next";

import { AdminRestaurantsView, type AdminRestaurantRow } from "@/components/admin/admin-restaurants-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].admin.restaurants,
  robots: { index: false },
};

export default async function AdminRestaurantsPage() {
  const supabase = getSupabaseServerClient();

  let rows: AdminRestaurantRow[] = [];
  let planCodes: string[] = [];

  if (supabase) {
    const [restaurantsResult, plansResult] = await Promise.all([
      supabase.rpc("admin_restaurants", { p_search: null, p_status: null, p_limit: 20, p_offset: 0 }),
      supabase.from("subscription_plans").select("code").order("sort_order", { ascending: true }),
    ]);

    rows = (restaurantsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      isPublished: row.is_published,
      createdAt: row.created_at,
      ownerEmail: row.owner_email,
      ownerName: row.owner_name,
      planCode: row.plan_code,
      productCount: Number(row.product_count ?? 0),
      tableCount: Number(row.table_count ?? 0),
      viewCount: Number(row.view_count ?? 0),
      totalCount: Number(row.total_count ?? 0),
    }));

    planCodes = (plansResult.data ?? []).map((plan) => plan.code);
  }

  return <AdminRestaurantsView initialRows={rows} planCodes={planCodes} />;
}
