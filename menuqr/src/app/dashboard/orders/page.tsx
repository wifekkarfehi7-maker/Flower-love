import type { Metadata } from "next";

import { OrdersView, type OrderWithItems } from "@/components/orders/orders-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderItem } from "@/types/database";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].orders.title,
  robots: { index: false },
};

export default async function OrdersPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let orders: OrderWithItems[] = [];
  let orderingEnabled = false;

  if (active && supabase) {
    // Today's orders only: a waiter's screen is about the room right now, and
    // an unbounded list would grow into a page nobody can read on a phone.
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const [ordersResult, tablesResult, settingsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", active.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("restaurant_tables").select("id, name").eq("restaurant_id", active.id),
      supabase.from("restaurant_settings").select("enable_ordering").eq("restaurant_id", active.id).maybeSingle(),
    ]);

    const rows = ordersResult.data ?? [];
    // The lines come as their own query rather than an embedded select: the
    // hand-written schema types declare no relationship between the two, and
    // teaching them one to save a round trip is not worth the coupling.
    const itemsResult = rows.length
      ? await supabase
          .from("order_items")
          .select("*")
          .in("order_id", rows.map((order) => order.id))
      : { data: [] };

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of itemsResult.data ?? []) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }

    const tableNames = new Map((tablesResult.data ?? []).map((table) => [table.id, table.name]));
    orders = rows.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
      tableName: order.table_id ? (tableNames.get(order.table_id) ?? null) : null,
    }));
    orderingEnabled = settingsResult.data?.enable_ordering ?? false;
  }

  return (
    <OrdersView
      restaurantId={active?.id ?? ""}
      initialOrders={orders}
      orderingEnabled={orderingEnabled}
    />
  );
}
