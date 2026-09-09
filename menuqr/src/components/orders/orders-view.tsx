"use client";

import { Bell, BellOff, ChefHat, Check, Clock, Loader2, ShoppingBag, X } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/lib/i18n/config";
import { formatPrice } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
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

  const [orders, setOrders] = React.useState<OrderWithItems[]>(initialOrders);
  const [soundOn, setSoundOn] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const audioRef = React.useRef<AudioContext | null>(null);
  const knownIds = React.useRef(new Set(initialOrders.map((order) => order.id)));

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

    const next = rows.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
      tableName: order.table_id ? (tableNames.get(order.table_id) ?? null) : null,
    }));

    const arrivals = next.filter((order) => !knownIds.current.has(order.id));
    next.forEach((order) => knownIds.current.add(order.id));
    setOrders(next);
    return arrivals;
  }, [restaurantId]);

  // A short two-tone chime, synthesised rather than fetched: no asset to ship,
  // nothing to 404 on a weak connection in a basement café.
  const chime = React.useCallback(() => {
    if (!soundOn) return;
    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      const now = context.currentTime;
      [880, 1320].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0.0001, now + index * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.16);
        oscillator.start(now + index * 0.18);
        oscillator.stop(now + index * 0.18 + 0.18);
      });
    } catch {
      // An audio context the browser refuses is not a reason to lose an order.
    }
  }, [soundOn]);

  // Realtime is how an order should arrive; this is what happens when it does
  // not. A café's wifi drops, a socket dies quietly, and a waiter's screen that
  // trusted the socket would simply stop showing orders — with no sign that
  // anything is wrong. Re-reading on a timer, and whenever the screen is looked
  // at again, means the worst case is a slow order rather than a lost one.
  React.useEffect(() => {
    const tick = async () => {
      const arrivals = await refresh();
      if (arrivals && arrivals.length > 0) {
        chime();
        toast({ title: t.orders.newOrder });
      }
    };

    const timer = window.setInterval(tick, 20000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, chime, toast, t.orders.newOrder]);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !restaurantId) return;

    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          const row = payload.new as Order;
          // The insert arrives without its lines, so fetch the order whole
          // rather than render a total with nothing under it.
          const [itemsResult, tableResult] = await Promise.all([
            supabase.from("order_items").select("*").eq("order_id", row.id),
            row.table_id
              ? supabase.from("restaurant_tables").select("name").eq("id", row.table_id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          const next: OrderWithItems = {
            ...row,
            items: itemsResult.data ?? [],
            tableName: tableResult.data?.name ?? null,
          };

          if (knownIds.current.has(next.id)) return;
          knownIds.current.add(next.id);
          setOrders((current) => (current.some((o) => o.id === next.id) ? current : [next, ...current]));
          chime();
          toast({ title: t.orders.newOrder, description: next.tableName ?? undefined });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const row = payload.new as Order;
          setOrders((current) =>
            current.map((order) => (order.id === row.id ? { ...order, status: row.status } : order))
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurantId, chime, toast, t.orders.newOrder]);

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
    }
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

        <button
          type="button"
          onClick={() => setSoundOn((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
          aria-pressed={soundOn}
        >
          {soundOn ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
          {soundOn ? t.orders.soundOn : t.orders.soundOff}
        </button>
      </div>

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
        <div>
          <p className="font-medium">{order.tableName ?? t.orders.noTable}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden />
            <time dateTime={order.created_at}>
              {placed.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
            </time>
          </p>
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
