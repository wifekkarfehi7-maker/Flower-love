import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Review } from "@/types/database";

export const REVIEW_PAGE_SIZE = 50;

export interface ReviewWithContextRow extends Review {
  tableName: string | null;
  orderNumber: number | null;
}

/**
 * One page of a venue's reviews, with the table and order number each was
 * left from. Shared by the server page and the "load more" button, so the two
 * cannot drift apart on what a review row carries.
 *
 * RLS decides what comes back — a member sees their venue's reviews, anyone
 * else sees none — so the restaurant filter here is for the index, not for
 * safety.
 */
export async function loadReviewPage(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  offset: number
): Promise<{ reviews: ReviewWithContextRow[]; hasMore: boolean }> {
  // One more than a page, to know whether there is a next one without a count.
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + REVIEW_PAGE_SIZE);

  const rows = data ?? [];
  const hasMore = rows.length > REVIEW_PAGE_SIZE;
  const page = rows.slice(0, REVIEW_PAGE_SIZE);

  const tableIds = [...new Set(page.map((review) => review.table_id).filter((id): id is string => Boolean(id)))];
  const orderIds = [...new Set(page.map((review) => review.order_id).filter((id): id is string => Boolean(id)))];

  const [tables, orders] = await Promise.all([
    tableIds.length
      ? supabase.from("restaurant_tables").select("id, name").in("id", tableIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    orderIds.length
      ? supabase.from("orders").select("id, order_number").in("id", orderIds)
      : Promise.resolve({ data: [] as { id: string; order_number: number | null }[] }),
  ]);

  const tableNames = new Map((tables.data ?? []).map((table) => [table.id, table.name]));
  const orderNumbers = new Map((orders.data ?? []).map((order) => [order.id, order.order_number]));

  return {
    hasMore,
    reviews: page.map((review) => ({
      ...review,
      tableName: review.table_id ? (tableNames.get(review.table_id) ?? null) : null,
      orderNumber: review.order_id ? (orderNumbers.get(review.order_id) ?? null) : null,
    })),
  };
}
