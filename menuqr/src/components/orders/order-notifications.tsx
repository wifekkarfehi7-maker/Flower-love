"use client";

import { ChevronLeft, ChevronRight, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { formatPrice, tableDisplayName } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useOrderAlerts, type OrderArrival } from "@/lib/orders/alerts-provider";
import { cn } from "@/lib/utils";

/**
 * How long a card stays on the orders screen itself, where the list already
 * shows the order. Everywhere else it stays until someone acts on it: a card
 * that dismisses itself while the waiter is carrying plates is the missed
 * order this exists to prevent.
 */
const LINGER_ON_ORDERS_MS = 8000;

/**
 * The card a new order arrives on.
 *
 * Modelled on a chat notification on purpose: it slides in over whatever the
 * staff were doing, says who it is from and what it is worth in one glance,
 * and the whole card is the button — a waiter with a tray in one hand should
 * not have to aim at a small link.
 *
 * It lives in the dashboard layout, so it appears on every screen, and it is
 * deliberately not the generic toast: a toast is a receipt for something you
 * just did, this is somebody else asking for your attention.
 */
export function OrderNotifications() {
  const { arrivals, dismiss, dismissAll } = useOrderAlerts();
  const pathname = usePathname();
  const onOrdersScreen = pathname.startsWith("/dashboard/orders");

  if (arrivals.length === 0) return null;

  return (
    <div
      className={cn(
        // Hangs just under the sticky header, where the bell is — the way a
        // chat app's notification drops from the top — so the bell and the
        // account menu it would otherwise cover stay reachable.
        "pointer-events-none fixed inset-x-0 top-16 z-[120] flex flex-col items-center gap-2 px-3 pt-2",
        "sm:inset-x-auto sm:items-end sm:px-4 ltr:sm:right-0 rtl:sm:left-0"
      )}
      // A waiter must not have to be looking at the screen to be told; this is
      // read out the moment it appears.
      role="alert"
      aria-live="assertive"
    >
      {arrivals.map((arrival, index) => (
        <OrderNotificationCard
          key={arrival.key}
          arrival={arrival}
          stacked={index > 0}
          linger={onOrdersScreen}
          onDismiss={() => dismiss(arrival.key)}
          onOpen={dismissAll}
        />
      ))}
    </div>
  );
}

function OrderNotificationCard({
  arrival,
  stacked,
  linger,
  onDismiss,
  onOpen,
}: {
  arrival: OrderArrival;
  stacked: boolean;
  /** Dismiss on a timer — only where the order is already on screen. */
  linger: boolean;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const { t, locale, dir } = useTranslation();
  const router = useRouter();
  const [leaving, setLeaving] = React.useState(false);

  const close = React.useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDismiss, 200);
  }, [onDismiss]);

  React.useEffect(() => {
    if (!linger) return;
    const timer = window.setTimeout(close, LINGER_ON_ORDERS_MS);
    return () => window.clearTimeout(timer);
  }, [close, linger]);

  const go = () => {
    onOpen();
    router.push("/dashboard/orders");
  };

  const Arrow = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div
      data-testid="order-notification"
      className={cn(
        "pointer-events-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-emerald-500/30",
        "bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10",
        "transition-all duration-200",
        leaving
          ? "-translate-y-2 opacity-0"
          : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 motion-safe:duration-300",
        // The ones underneath are history, not the news: they step back so the
        // newest card is unmistakably the one to read.
        stacked && "scale-[0.97] opacity-80"
      )}
    >
      {/* A band of colour so the card reads as "an order" from across a room,
          before any of the text is legible. */}
      <div className="h-1.5 w-full bg-emerald-500" />

      <div className="flex items-start gap-3 p-4">
        <span
          aria-hidden
          className="relative grid size-11 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
        >
          <ShoppingBag className="size-5" />
          <span className="absolute -end-0.5 -top-0.5 size-3 rounded-full border-2 border-card bg-emerald-500" />
        </span>

        <button
          type="button"
          onClick={go}
          className="min-w-0 flex-1 text-start"
          aria-label={`${t.orders.newOrder} — ${t.orders.openOrder}`}
        >
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{t.orders.newOrder}</span>
            {arrival.orderNumber != null ? (
              <span className="shrink-0 rounded-full bg-emerald-500/12 px-2 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                #{arrival.orderNumber}
              </span>
            ) : null}
          </span>

          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-semibold">
              {arrival.tableName ? tableDisplayName(arrival.tableName, t.menu.tableLabel) : t.orders.noTable}
            </span>
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <span className="font-semibold tabular-nums">
              {formatPrice(arrival.total, arrival.currency, locale)}
            </span>
          </span>

          {/* The order itself, like the first line of a message: enough for
              the kitchen to start before anyone opens the list. */}
          {arrival.preview ? (
            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground" data-testid="order-notification-preview">
              {arrival.preview}
            </span>
          ) : null}

          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {t.orders.openOrder}
            <Arrow className="size-3.5" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          onClick={close}
          className="-me-1 -mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t.common.close}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
