import type { Metadata } from "next";

import { TablesView, type TableWithScans } from "@/components/tables/tables-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].tables.title,
  robots: { index: false },
};

export default async function TablesPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let tables: TableWithScans[] = [];

  if (active && supabase) {
    const [tablesResult, qrResult] = await Promise.all([
      supabase
        .from("restaurant_tables")
        .select("*")
        .eq("restaurant_id", active.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase.from("qr_codes").select("table_id, scan_count").eq("restaurant_id", active.id),
    ]);

    const scansByTable = new Map((qrResult.data ?? []).map((qr) => [qr.table_id, qr.scan_count]));
    tables = (tablesResult.data ?? []).map((table) => ({
      ...table,
      scanCount: scansByTable.get(table.id) ?? 0,
    }));
  }

  return <TablesView initialTables={tables} />;
}
