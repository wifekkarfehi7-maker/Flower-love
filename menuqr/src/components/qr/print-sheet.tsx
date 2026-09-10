"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useTranslation } from "@/lib/i18n/provider";
import type { QrEntry } from "@/lib/qr/get-qr-entries";
import { qrTargetUrl } from "@/lib/qr/urls";
import type { Restaurant } from "@/types/database";
import { QrCard } from "./qr-card";

export function PrintSheet({ restaurant, entries }: { restaurant: Restaurant; entries: QrEntry[] }) {
  const { t } = useTranslation();
  const active = entries.filter((entry) => entry.qr.is_active);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between gap-3">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/qr">
            <ArrowLeft className="rtl-flip" aria-hidden />
            {t.common.back}
          </Link>
        </Button>
        <Button onClick={() => window.print()} disabled={active.length === 0}>
          <Printer aria-hidden />
          {t.common.print}
        </Button>
      </div>

      {active.length === 0 ? (
        <div className="surface">
          <EmptyState title={t.qr.emptyTitle} description={t.qr.emptyText} />
        </div>
      ) : (
        <div className="print-sheet grid grid-cols-1 gap-4 sm:grid-cols-2">
          {active.map((entry) => (
            <QrCard
              key={entry.qr.id}
              restaurant={restaurant}
              tableName={entry.tableName}
              url={qrTargetUrl(restaurant.slug, entry.qr.table_id ? entry.qr.token : null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
