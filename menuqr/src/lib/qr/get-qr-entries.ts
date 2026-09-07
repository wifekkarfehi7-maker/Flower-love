import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { QrCode } from "@/types/database";

export interface QrEntry {
  qr: QrCode;
  tableName: string | null;
}

/** QR codes for a venue: the general one first, then one per live table. */
export async function getQrEntries(restaurantId: string): Promise<QrEntry[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const [qrResult, tablesResult] = await Promise.all([
    supabase.from("qr_codes").select("*").eq("restaurant_id", restaurantId),
    supabase
      .from("restaurant_tables")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurantId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const tables = tablesResult.data ?? [];
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const orderById = new Map(tables.map((table, index) => [table.id, index]));

  return (qrResult.data ?? [])
    .filter((qr) => !qr.table_id || tableById.has(qr.table_id))
    .map((qr) => ({ qr, tableName: qr.table_id ? (tableById.get(qr.table_id)?.name ?? null) : null }))
    .sort((a, b) => {
      if (!a.qr.table_id) return -1;
      if (!b.qr.table_id) return 1;
      return (orderById.get(a.qr.table_id) ?? 0) - (orderById.get(b.qr.table_id) ?? 0);
    });
}
