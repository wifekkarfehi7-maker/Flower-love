"use client";

import { ImageIcon, Minus, Plus } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n/config";
import { formatPrice, localized } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";
import type { OptionGroupWithOptions } from "@/lib/menu/get-public-menu";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

export interface CartSelection {
  product: Product;
  quantity: number;
  optionIds: string[];
  unitPrice: number;
}

export function ProductSheet({
  product,
  optionGroups,
  open,
  onOpenChange,
  locale,
  fallbackLocale,
  currency,
  showPrice,
  showImage,
  cartEnabled,
  t,
  onAddToCart,
}: {
  product: Product | null;
  optionGroups: OptionGroupWithOptions[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  fallbackLocale: Locale;
  currency: string;
  showPrice: boolean;
  showImage: boolean;
  cartEnabled: boolean;
  t: Dictionary;
  onAddToCart: (selection: CartSelection) => void;
}) {
  const [selected, setSelected] = React.useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    if (open) {
      setSelected({});
      setQuantity(1);
    }
  }, [open, product?.id]);

  if (!product) return null;

  const name = localized(product, "name", locale, fallbackLocale);
  const description = localized(product, "description", locale, fallbackLocale);

  const selectedIds = Object.values(selected).flat();
  const optionsById = new Map(optionGroups.flatMap((group) => group.options.map((option) => [option.id, option])));
  const extras = selectedIds.reduce((total, id) => total + Number(optionsById.get(id)?.price_delta ?? 0), 0);
  const unitPrice = Number(product.price) + extras;

  const toggleOption = (group: OptionGroupWithOptions, optionId: string) => {
    setSelected((current) => {
      const chosen = current[group.id] ?? [];
      if (group.max_select <= 1) {
        return { ...current, [group.id]: chosen.includes(optionId) ? [] : [optionId] };
      }
      if (chosen.includes(optionId)) {
        return { ...current, [group.id]: chosen.filter((id) => id !== optionId) };
      }
      if (chosen.length >= group.max_select) return current;
      return { ...current, [group.id]: [...chosen, optionId] };
    });
  };

  const unmetRequirement = optionGroups.some(
    (group) => group.is_required && (selected[group.id]?.length ?? 0) < Math.max(group.min_select, 1)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)] sm:max-w-md">
        {showImage && product.image_url ? (
          <div className="relative aspect-[4/3] w-full shrink-0 bg-[var(--menu-surface-alt)]">
            <Image src={product.image_url} alt="" fill sizes="(max-width: 640px) 100vw, 448px" className="object-cover" priority />
          </div>
        ) : showImage ? (
          <div className="flex aspect-[16/7] w-full shrink-0 items-center justify-center bg-[var(--menu-surface-alt)] text-[var(--menu-muted)]">
            <ImageIcon className="size-8" aria-hidden />
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DialogTitle className="text-xl">{name}</DialogTitle>

          {description ? (
            <DialogDescription className="mt-2 text-[15px] leading-relaxed text-[var(--menu-muted)]">
              {description}
            </DialogDescription>
          ) : null}

          {showPrice ? (
            <p className="mt-3 text-lg font-semibold tabular-nums text-[var(--menu-accent)]">
              {formatPrice(product.price, currency, locale)}
            </p>
          ) : null}

          {!product.is_available ? (
            <p className="mt-3 rounded-lg bg-[var(--menu-surface-alt)] px-3 py-2 text-sm text-[var(--menu-muted)]">
              {t.menu.unavailable}
            </p>
          ) : null}

          {optionGroups.length > 0 ? (
            <div className="mt-5 space-y-5">
              {optionGroups.map((group) => {
                const chosen = selected[group.id] ?? [];
                return (
                  <fieldset key={group.id}>
                    <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      {localized(group, "name", locale, fallbackLocale)}
                      {group.is_required ? (
                        <span className="rounded-full bg-[var(--menu-accent)] px-2 py-0.5 text-[10px] font-medium text-[var(--menu-accent-text)]">
                          {t.products.groupRequired}
                        </span>
                      ) : null}
                    </legend>

                    <div className="space-y-1.5">
                      {group.options.map((option) => {
                        const isChosen = chosen.includes(option.id);
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              "flex cursor-pointer items-center justify-between gap-3 rounded-[calc(var(--menu-radius)-2px)] border px-3 py-2.5 text-sm transition-colors",
                              isChosen
                                ? "border-[var(--menu-accent)] bg-[var(--menu-accent)]/[0.08]"
                                : "border-[var(--menu-border)]"
                            )}
                          >
                            <span className="flex items-center gap-2.5">
                              <input
                                type={group.max_select <= 1 ? "radio" : "checkbox"}
                                name={`group-${group.id}`}
                                checked={isChosen}
                                onChange={() => toggleOption(group, option.id)}
                                className="size-4 accent-[var(--menu-accent)]"
                              />
                              <span>{localized(option, "name", locale, fallbackLocale)}</span>
                            </span>
                            {Number(option.price_delta) !== 0 && showPrice ? (
                              <span className="shrink-0 tabular-nums text-[var(--menu-muted)]">
                                {Number(option.price_delta) > 0 ? "+" : ""}
                                {formatPrice(option.price_delta, currency, locale)}
                              </span>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          ) : null}
        </div>

        {cartEnabled && product.is_available ? (
          <div className="flex items-center gap-3 border-t border-[var(--menu-border)] bg-[var(--menu-surface)] p-4">
            <div className="flex items-center gap-1 rounded-full border border-[var(--menu-border)] p-1">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="flex size-8 items-center justify-center rounded-full text-[var(--menu-text)] disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label={t.common.previous}
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                className="flex size-8 items-center justify-center rounded-full text-[var(--menu-text)]"
                aria-label={t.common.next}
              >
                <Plus className="size-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={unmetRequirement}
              onClick={() => {
                onAddToCart({ product, quantity, optionIds: selectedIds, unitPrice });
                onOpenChange(false);
              }}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--menu-accent)] px-4 text-sm font-semibold text-[var(--menu-accent-text)] transition-opacity disabled:opacity-50"
            >
              {t.menu.addToCart}
              {showPrice ? <span className="tabular-nums">· {formatPrice(unitPrice * quantity, currency, locale)}</span> : null}
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
