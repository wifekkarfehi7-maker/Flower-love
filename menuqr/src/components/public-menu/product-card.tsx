"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";

import { formatPrice, localized } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

export function ProductCard({
  product,
  locale,
  fallbackLocale,
  currency,
  showImage,
  showPrice,
  t,
  onSelect,
}: {
  product: Product;
  locale: Locale;
  fallbackLocale: Locale;
  currency: string;
  showImage: boolean;
  showPrice: boolean;
  t: Dictionary;
  onSelect: () => void;
}) {
  const name = localized(product, "name", locale, fallbackLocale);
  const description = localized(product, "description", locale, fallbackLocale);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full items-stretch gap-3 rounded-[var(--menu-radius)] border p-3 text-start transition-transform",
        "border-[var(--menu-border)] bg-[var(--menu-surface)] active:scale-[0.995]",
        !product.is_available && "opacity-60"
      )}
      aria-label={name}
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="flex items-start gap-2">
          <span className="text-[15px] font-semibold leading-snug text-[var(--menu-text)]">{name}</span>
        </span>

        {description ? (
          <span className="line-clamp-2 text-[13px] leading-relaxed text-[var(--menu-muted)]">{description}</span>
        ) : null}

        <span className="mt-1 flex items-center gap-2">
          {showPrice ? (
            <span className="text-[15px] font-semibold tabular-nums text-[var(--menu-accent)]">
              {formatPrice(product.price, currency, locale)}
            </span>
          ) : null}
          {product.compare_at_price && showPrice ? (
            <span className="text-xs tabular-nums text-[var(--menu-muted)] line-through">
              {formatPrice(product.compare_at_price, currency, locale)}
            </span>
          ) : null}
          {!product.is_available ? (
            <span className="rounded-full bg-[var(--menu-surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--menu-muted)]">
              {t.menu.unavailable}
            </span>
          ) : null}
        </span>
      </span>

      {showImage ? (
        <span className="relative size-[88px] shrink-0 overflow-hidden rounded-[calc(var(--menu-radius)-2px)] bg-[var(--menu-surface-alt)]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt=""
              fill
              sizes="88px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[var(--menu-muted)]">
              <ImageIcon className="size-5" aria-hidden />
            </span>
          )}
        </span>
      ) : null}
    </button>
  );
}
