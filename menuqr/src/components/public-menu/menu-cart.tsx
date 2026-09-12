"use client";

import { Check, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { orderErrorMessage, placeOrder, readOrderReceipt, type OrderReceipt, type OrderStatus } from "@/lib/orders/place-order";
import type { Locale } from "@/lib/i18n/config";
import { formatPrice, localized } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  optionLabels: string[];
  optionIds: string[];
  unitPrice: number;
}

/**
 * Two things wear the same list. With ordering off it stays what it always
 * was — a browser-only tally a guest shows the waiter, and the copy says so.
 * With ordering on the same list is sent, and from then on this shows the
 * order's status rather than a basket, because the guest's question changes
 * from "what am I having" to "is it coming".
 *
 * The prices here are for the guest to read. The server prices the order
 * again from its own menu, so what is sent is products and quantities.
 */
export function MenuCart({
  open,
  onOpenChange,
  items,
  onChangeQuantity,
  onRemove,
  onClear,
  onOrderPlaced,
  locale,
  fallbackLocale,
  currency,
  t,
  orderingEnabled,
  restaurantId,
  tableId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onChangeQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  /** Empties the basket without closing: the confirmation replaces it. */
  onOrderPlaced: () => void;
  locale: Locale;
  fallbackLocale: Locale;
  currency: string;
  t: Dictionary;
  orderingEnabled: boolean;
  restaurantId: string;
  tableId: string | null;
}) {
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const [note, setNote] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [receipt, setReceipt] = React.useState<OrderReceipt | null>(null);

  const statusLabel: Record<OrderStatus, string> = {
    pending: t.menu.orderStatusPending,
    confirmed: t.menu.orderStatusConfirmed,
    preparing: t.menu.orderStatusPreparing,
    served: t.menu.orderStatusServed,
    cancelled: t.menu.orderStatusCancelled,
  };

  // The trail a guest watches. Cancelled is not a step on it — it ends the
  // order, so it is shown on its own rather than as a stalled fourth dot.
  const TRAIL: OrderStatus[] = ["pending", "confirmed", "preparing", "served"];
  const status = receipt?.status ?? "pending";
  const reached = TRAIL.indexOf(status);

  // While an order is open the guest wants to know where it is. Polling is
  // enough here: a phone on a café's wifi that reconnects mid-meal would have
  // to re-establish a socket anyway, and this survives that without code.
  React.useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const tick = async () => {
      const next = await readOrderReceipt(orderId);
      if (!cancelled && next) setReceipt(next);
    };

    void tick();
    const timer = window.setInterval(tick, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [orderId]);

  const send = async () => {
    setSending(true);
    setError(null);

    const result = await placeOrder({
      restaurantId,
      tableId,
      lines: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        optionIds: item.optionIds,
      })),
      note,
    });

    setSending(false);

    if ("error" in result) {
      setError(orderErrorMessage(result.error, t));
      return;
    }

    setOrderId(result.orderId);
    setReceipt(null);
    setNote("");
    onOrderPlaced();
  };

  const startAnother = () => {
    setOrderId(null);
    setReceipt(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)] sm:max-w-md">
        {/* Once an order exists the receipt below carries its own heading, so
            the dialog's is kept for screen readers only rather than printed
            twice. */}
        {orderId ? (
          <>
            <DialogTitle className="sr-only">{t.menu.orderPlaced}</DialogTitle>
            <DialogDescription className="sr-only">{t.menu.orderPlacedText}</DialogDescription>
          </>
        ) : (
          <div className="px-5 pb-2 pt-4">
            <DialogTitle>{t.menu.cart}</DialogTitle>
            <DialogDescription className="mt-1 text-[var(--menu-muted)]">
              {orderingEnabled ? t.menu.cartOrderNote : t.menu.cartNote}
            </DialogDescription>
          </div>
        )}

        {orderId ? (
          <div className="flex flex-col">
            {/* A band, not a tick floating in white space: on a phone this is
                the whole screen, and the guest should know at a glance that
                the order left. */}
            <div className="flex flex-col items-center gap-2 bg-[var(--menu-accent)] px-5 py-6 text-[var(--menu-accent-text)]">
              <span className="flex size-11 items-center justify-center rounded-full bg-white/20">
                <Check className="size-6" strokeWidth={3} aria-hidden />
              </span>
              <p className="text-sm font-medium opacity-90">{t.menu.orderPlaced}</p>
            </div>

            {/* The number, given the room to be read across a table. */}
            <div className="flex items-center justify-between gap-4 border-b border-[var(--menu-border)] px-5 py-4">
              <div>
                <p className="text-xs text-[var(--menu-muted)]">{t.menu.orderNumberLabel}</p>
                <p className="text-3xl font-bold leading-tight tabular-nums">{receipt?.orderNumber ?? "—"}</p>
              </div>
              {receipt?.tableName ? (
                <div className="text-end">
                  <p className="text-xs text-[var(--menu-muted)]">{t.menu.tableLabel}</p>
                  <p className="text-lg font-semibold leading-tight">{receipt.tableName}</p>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Where it has got to. */}
              <div className="border-b border-[var(--menu-border)] px-5 py-4">
                {status === "cancelled" ? (
                  <p
                    className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-600 dark:text-red-400"
                    aria-live="polite"
                  >
                    {t.menu.orderStatusCancelled}
                  </p>
                ) : (
                  <ol className="flex items-start justify-between" aria-live="polite">
                    {TRAIL.map((step, index) => {
                      const done = index <= reached;
                      return (
                        <li key={step} className="flex flex-1 flex-col items-center gap-2 text-center">
                          <div className="flex w-full items-center">
                            <span
                              className={cn(
                                "h-0.5 flex-1",
                                index === 0 ? "opacity-0" : done ? "bg-[var(--menu-accent)]" : "bg-[var(--menu-border)]"
                              )}
                            />
                            <span
                              className={cn(
                                "size-3 shrink-0 rounded-full transition-colors",
                                done ? "bg-[var(--menu-accent)]" : "bg-[var(--menu-border)]",
                                index === reached && "ring-4 ring-[var(--menu-accent)]/25"
                              )}
                            />
                            <span
                              className={cn(
                                "h-0.5 flex-1",
                                index === TRAIL.length - 1
                                  ? "opacity-0"
                                  : index < reached
                                    ? "bg-[var(--menu-accent)]"
                                    : "bg-[var(--menu-border)]"
                              )}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[11px] leading-tight",
                              done ? "font-semibold" : "text-[var(--menu-muted)]"
                            )}
                          >
                            {statusLabel[step]}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* What was ordered. */}
              {receipt && receipt.items.length > 0 ? (
                <div className="px-5 py-4">
                  <ul className="space-y-2.5 text-sm">
                    {receipt.items.map((item, index) => (
                      <li key={`${item.name}-${index}`} className="flex justify-between gap-3">
                        <span className="flex gap-2">
                          <span className="min-w-6 tabular-nums text-[var(--menu-muted)]">{item.quantity}×</span>
                          {item.name}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatPrice(item.line_total, currency, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-[var(--menu-border)] pt-3 font-semibold">
                    <span>{t.menu.cartTotal}</span>
                    <span className="tabular-nums text-[var(--menu-accent)]">
                      {formatPrice(receipt.total, currency, locale)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Pinned, so it is under the thumb wherever the receipt ends. */}
            <div className="border-t border-[var(--menu-border)] p-4">
              <p className="mb-3 text-center text-xs text-[var(--menu-muted)]">{t.menu.orderPlacedText}</p>
              <button
                type="button"
                onClick={startAnother}
                className="w-full rounded-full border border-[var(--menu-border)] px-4 py-3 text-sm font-medium"
              >
                {t.menu.orderNewOne}
              </button>
            </div>
          </div>
        ) : (
          <>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-[var(--menu-muted)]">
              <ShoppingBag className="size-8" aria-hidden />
              <p className="text-sm">{t.menu.cartEmpty}</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--menu-border)]">
              {items.map((item) => (
                <li key={item.key} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {localized(item.product, "name", locale, fallbackLocale)}
                    </p>
                    {item.optionLabels.length > 0 ? (
                      <p className="mt-0.5 text-xs text-[var(--menu-muted)]">{item.optionLabels.join(" · ")}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--menu-accent)]">
                      {formatPrice(item.unitPrice * item.quantity, currency, locale)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--menu-border)] p-1">
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(item.key, item.quantity - 1)}
                      className="flex size-7 items-center justify-center rounded-full"
                      aria-label={t.common.previous}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-5 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(item.key, item.quantity + 1)}
                      className="flex size-7 items-center justify-center rounded-full"
                      aria-label={t.common.next}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.key)}
                    className="shrink-0 p-1.5 text-[var(--menu-muted)]"
                    aria-label={t.common.delete}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-[var(--menu-border)] p-4">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>{t.menu.cartTotal}</span>
              <span className="tabular-nums text-[var(--menu-accent)]">{formatPrice(total, currency, locale)}</span>
            </div>
            {orderingEnabled ? (
              <>
                <label className="sr-only" htmlFor="orderNote">
                  {t.menu.orderNotePlaceholder}
                </label>
                <textarea
                  id="orderNote"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t.menu.orderNotePlaceholder}
                  rows={2}
                  maxLength={500}
                  className="mt-3 w-full resize-none rounded-2xl border border-[var(--menu-border)] bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[var(--menu-muted)]"
                />

                {error ? (
                  <p className="mt-2 text-sm text-red-500" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={send}
                  disabled={sending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--menu-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--menu-on-accent)] disabled:opacity-60"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {sending ? t.menu.orderSending : t.menu.orderSend}
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={onClear}
              className="mt-3 w-full rounded-full border border-[var(--menu-border)] px-4 py-2 text-sm text-[var(--menu-muted)]"
            >
              {t.menu.clearCart}
            </button>
          </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
