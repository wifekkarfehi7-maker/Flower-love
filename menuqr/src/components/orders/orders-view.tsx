"use client";

import { Bell, BellOff, BellRing, ChefHat, Check, Clock, Loader2, ShoppingBag, X } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/lib/i18n/config";
import { formatPrice } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useOrderAlerts } from "@/lib/orders/alerts-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { OrderItem, OrderStatus, Order } from "@/types/database";

export interface OrderWithItems extends Order {
  items: OrderItem[];
  tableName: string | null;
}

const OPEN_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing"];

/**
 * A waiter's screen, so it is built for the way it is actually used: propped
 * up on a counter, glanced at across a room, touched with one hand.
 *
 * New orders arrive over Realtime rather than by polling, because the gap
 * between a guest tapping send and a waiter noticing is the whole point of the
 * feature. The chime is opt-in and remembered: browsers refuse to play audio
 * before the page has been interacted with, so a sound that "just works" on
 * first load is not something this can promise.
 */
export function OrdersView({
  restaurantId,
  initialOrders,
  orderingEnabled,
}: {
  restaurantId: string;
  initialOrders: OrderWithItems[];
  orderingEnabled: boolean;
}) {
  const { t, locale } = useTranslation();
  const toast = useToast();

  const { refresh: refreshAlerts, soundOn, setSoundOn, revision, pushPermission, requestPush } = useOrderAlerts();
  const [orders, setOrders] = React.useState<OrderWithItems[]>(initialOrders);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Arrivals, the chime and the count belong to the provider, which listens for
  // the whole dashboard; this screen refetches when it says something changed.
  const refresh = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !restaurantId) return;

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const { data: rows } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);

    if (!rows) return;

    const [itemsResult, tablesResult] = await Promise.all([
      rows.length
        ? supabase.from("order_items").select("*").in("order_id", rows.map((order) => order.id))
        : Promise.resolve({ data: [] as OrderItem[] }),
      supabase.from("restaurant_tables").select("id, name").eq("restaurant_id", restaurantId),
    ]);

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of itemsResult.data ?? []) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }
    const tableNames = new Map((tablesResult.data ?? []).map((table) => [table.id, table.name]));

    setOrders(
      rows.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
        tableName: order.table_id ? (tableNames.get(order.table_id) ?? null) : null,
      }))
    );
  }, [restaurantId]);

  React.useEffect(() => {
    if (revision > 0) void refresh();
  }, [revision, refresh]);

  const setStatus = async (orderId: string, status: OrderStatus) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(orderId);
    const previous = orders;
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));

    const { error } = await supabase.rpc("set_order_status", { p_order: orderId, p_status: status });
    setBusy(null);

    if (error) {
      setOrders(previous);
      toast({ title: t.errors.saveFailed, variant: "error" });
      return;
    }
    // The waiting count on the bell should drop the moment the order is
    // confirmed here, not on the next timed re-read.
    refreshAlerts();
  };

  const statusLabel: Record<OrderStatus, string> = {
    pending: t.orders.statusPending,
    confirmed: t.orders.statusConfirmed,
    preparing: t.orders.statusPreparing,
    served: t.orders.statusServed,
    cancelled: t.orders.statusCancelled,
  };

  const open = orders.filter((order) => OPEN_STATUSES.includes(order.status));
  const done = orders.filter((order) => !OPEN_STATUSES.includes(order.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.orders.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.orders.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundOn(!soundOn)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              soundOn && "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
            )}
            aria-pressed={soundOn}
          >
            {soundOn ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
            {soundOn ? t.orders.soundOn : t.orders.soundOff}
          </button>

          {/* A browser only shows a notification outside the tab once asked,
              and only if the asking came from a tap — so it is a button, not
              something that happens by itself on load. */}
          {pushPermission === "default" ? (
            <button
              type="button"
              onClick={requestPush}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              data-testid="enable-notifications"
            >
              <BellRing className="size-4" aria-hidden />
              {t.orders.notifyEnable}
            </button>
          ) : pushPermission === "granted" ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-800 dark:text-emerald-300">
              <BellRing className="size-4" aria-hidden />
              {t.orders.notifyOn}
            </span>
          ) : pushPermission === "denied" ? (
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground">
              <BellOff className="size-4" aria-hidden />
              {t.orders.notifyBlocked}
            </span>
          ) : null}
        </div>
      </div>

      {pushPermission === "default" ? (
        <p className="-mt-3 text-xs text-muted-foreground">{t.orders.notifyHint}</p>
      ) : null}

      {!orderingEnabled ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {t.orders.disabledNotice}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag />} title={t.orders.emptyTitle} description={t.orders.emptyText} />
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t.orders.openHeading} ({open.length})
            </h2>
            {open.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.orders.noneOpen}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {open.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    locale={locale}
                    statusLabel={statusLabel}
                    busy={busy === order.id}
                    onStatus={setStatus}
                    t={t}
                  />
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {t.orders.closedHeading} ({done.length})
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {done.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    locale={locale}
                    statusLabel={statusLabel}
                    busy={busy === order.id}
                    onStatus={setStatus}
                    t={t}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  locale,
  statusLabel,
  busy,
  onStatus,
  t,
}: {
  order: OrderWithItems;
  locale: Locale;
  statusLabel: Record<OrderStatus, string>;
  busy: boolean;
  onStatus: (id: string, status: OrderStatus) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const placed = new Date(order.created_at);
  const closed = order.status === "served" || order.status === "cancelled";

  return (
    <li
      className={cn(
        "rounded-2xl border p-4",
        order.status === "pending" && "border-primary/40 bg-primary/5",
        closed && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* The number the guest is holding, big enough to read across a
              counter and match to what they say. */}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold tabular-nums">
            {order.order_number ?? "–"}
          </span>
          <div>
            <p className="font-medium">{order.tableName ?? t.orders.noTable}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              <time dateTime={order.created_at}>
                {placed.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </time>
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs">{statusLabel[order.status]}</span>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              <span className="tabular-nums text-muted-foreground">{item.quantity}×</span> {item.name_snapshot}
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(item.line_total, "TND", locale)}</span>
          </li>
        ))}
      </ul>

      {order.customer_note ? (
        <p className="mt-3 rounded-xl bg-muted p-2 text-xs italic">{order.customer_note}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-semibold">
        <span>{t.orders.total}</span>
        <span className="tabular-nums">{formatPrice(order.total, "TND", locale)}</span>
      </div>

      {!closed ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {order.status === "pending" ? (
            <ActionButton onClick={() => onStatus(order.id, "confirmed")} busy={busy} icon={Check}>
              {t.orders.actionConfirm}
            </ActionButton>
          ) : null}
          {order.status === "confirmed" ? (
            <ActionButton onClick={() => onStatus(order.id, "preparing")} busy={busy} icon={ChefHat}>
              {t.orders.actionPreparing}
            </ActionButton>
          ) : null}
          {order.status === "preparing" ? (
            <ActionButton onClick={() => onStatus(order.id, "served")} busy={busy} icon={Check}>
              {t.orders.actionServed}
            </ActionButton>
          ) : null}
          <ActionButton onClick={() => onStatus(order.id, "cancelled")} busy={busy} icon={X} subdued>
            {t.orders.actionCancel}
          </ActionButton>
        </div>
      ) : null}
    </li>
  );
}

function ActionButton({
  onClick,
  busy,
  icon: Icon,
  subdued,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  icon: typeof Check;
  subdued?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium disabled:opacity-60",
        subdued ? "border text-muted-foreground" : "bg-primary text-primary-foreground"
      )}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}
