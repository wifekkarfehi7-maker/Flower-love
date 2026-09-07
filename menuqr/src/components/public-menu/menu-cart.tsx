"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n/config";
import { formatPrice, localized } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";
import type { Product } from "@/types/database";

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  optionLabels: string[];
  unitPrice: number;
}

/**
 * A local, browser-only selection list. Nothing is sent anywhere: guests use
 * it to add up what they want before telling the waiter, and the copy says so.
 * Real ordering is a later feature with its own tables already in the schema.
 */
export function MenuCart({
  open,
  onOpenChange,
  items,
  onChangeQuantity,
  onRemove,
  onClear,
  locale,
  fallbackLocale,
  currency,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onChangeQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  locale: Locale;
  fallbackLocale: Locale;
  currency: string;
  t: Dictionary;
}) {
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)] sm:max-w-md">
        <div className="px-5 pb-2 pt-5">
          <DialogTitle>{t.menu.cart}</DialogTitle>
          <DialogDescription className="mt-1 text-[var(--menu-muted)]">{t.menu.cartNote}</DialogDescription>
        </div>

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
            <button
              type="button"
              onClick={onClear}
              className="mt-3 w-full rounded-full border border-[var(--menu-border)] px-4 py-2 text-sm text-[var(--menu-muted)]"
            >
              {t.menu.clearCart}
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
