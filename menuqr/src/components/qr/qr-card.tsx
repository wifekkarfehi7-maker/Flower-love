"use client";

import Image from "next/image";

import { LogoMark } from "@/components/brand/logo";
import { localeLabel, locales, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/types/database";
import { QrImage } from "./qr-image";

/**
 * The physical card that ends up on a table: venue mark, table name, the
 * code, and the languages the menu is available in. Sized and styled to print
 * cleanly two-up on A4 via the print stylesheet in globals.css.
 */
export function QrCard({
  restaurant,
  url,
  tableName,
  className,
  size = 180,
}: {
  restaurant: Restaurant;
  url: string;
  tableName?: string | null;
  className?: string;
  size?: number;
}) {
  const { t } = useTranslation();
  const available = (restaurant.available_languages?.length ? restaurant.available_languages : locales) as Locale[];

  return (
    <div
      className={cn(
        "print-card flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-6 text-center",
        className
      )}
    >
      {restaurant.logo_url ? (
        <span className="relative size-14 overflow-hidden rounded-full bg-muted">
          <Image src={restaurant.logo_url} alt="" fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <LogoMark className="size-10" />
      )}

      <p className="text-base font-semibold leading-tight text-sand-950">{restaurant.name}</p>

      {tableName ? (
        <p className="rounded-full bg-sand-100 px-3 py-1 text-sm font-medium text-sand-800">{tableName}</p>
      ) : null}

      <p className="text-sm text-sand-600">{t.qr.scanToView}</p>

      <QrImage value={url} size={size} alt="" />

      <p className="text-[11px] text-sand-500">
        {t.qr.availableIn} {available.map((locale) => localeLabel[locale]).join(" • ")}
      </p>
    </div>
  );
}
