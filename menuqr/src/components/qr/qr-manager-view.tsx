"use client";

import { Copy, Download, FileCode, Printer, QrCode, RefreshCw, Store, Table2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert, AlertText, EmptyState, PageHeader } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { formatNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import type { QrEntry } from "@/lib/qr/get-qr-entries";
import { downloadQrPng, downloadQrSvg } from "@/lib/qr/render";
import { qrTargetUrl } from "@/lib/qr/urls";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { randomToken, slugify } from "@/lib/utils";
import { QrImage } from "./qr-image";

function QrRow({
  entry,
  onRegenerate,
  onToggle,
}: {
  entry: QrEntry;
  onRegenerate: (entry: QrEntry) => void;
  onToggle: (entry: QrEntry) => void;
}) {
  const { t } = useTranslation();
  const { restaurant, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("qr:write");

  const url = qrTargetUrl(restaurant.slug, entry.qr.table_id ? entry.qr.token : null);
  const filename = `${slugify(restaurant.name) || "menu"}-${entry.tableName ? slugify(entry.tableName) : "general"}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t.common.copied, variant: "success" });
    } catch {
      toast({ title: t.common.error, variant: "error" });
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
      <div className="mx-auto shrink-0 sm:mx-0">
        <QrImage value={url} size={112} className="border border-border" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          {entry.tableName ? (
            <>
              <Table2 className="size-4 text-muted-foreground" aria-hidden />
              {entry.tableName}
            </>
          ) : (
            <>
              <Store className="size-4 text-muted-foreground" aria-hidden />
              {t.qr.generalQr}
            </>
          )}
          {!entry.qr.is_active ? <Badge variant="neutral">{t.qr.disabled}</Badge> : null}
        </p>

        <p className="mt-1 break-all font-mono text-xs text-muted-foreground" dir="ltr">
          {url}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {formatNumber(entry.qr.scan_count)} {t.tables.scans}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void copy()}>
            <Copy aria-hidden />
            {t.common.copyLink}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void downloadQrPng(url, filename)}>
            <Download aria-hidden />
            {t.qr.downloadPng}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void downloadQrSvg(url, filename)}>
            <FileCode aria-hidden />
            {t.qr.downloadSvg}
          </Button>
          {canWrite && entry.qr.table_id ? (
            <Button variant="ghost" size="sm" onClick={() => onRegenerate(entry)}>
              <RefreshCw aria-hidden />
              {t.qr.regenerate}
            </Button>
          ) : null}
        </div>
      </div>

      {canWrite ? (
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <span className="text-xs text-muted-foreground">{entry.qr.is_active ? t.common.active : t.qr.disabled}</span>
          <Switch
            checked={entry.qr.is_active}
            onCheckedChange={() => onToggle(entry)}
            aria-label={entry.qr.is_active ? t.qr.disable : t.qr.enable}
          />
        </div>
      ) : null}
    </div>
  );
}

export function QrManagerView({ initialEntries }: { initialEntries: QrEntry[] }) {
  const { t } = useTranslation();
  const { can } = useRestaurant();
  const toast = useToast();

  const [entries, setEntries] = React.useState(initialEntries);
  const [regenerating, setRegenerating] = React.useState<QrEntry | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => setEntries(initialEntries), [initialEntries]);

  const general = entries.filter((entry) => !entry.qr.table_id);
  const tableEntries = entries.filter((entry) => entry.qr.table_id);

  const toggle = async (entry: QrEntry) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const next = !entry.qr.is_active;
    setEntries((current) =>
      current.map((item) => (item.qr.id === entry.qr.id ? { ...item, qr: { ...item.qr, is_active: next } } : item))
    );

    const { error } = await supabase.from("qr_codes").update({ is_active: next }).eq("id", entry.qr.id);
    if (error) {
      setEntries((current) =>
        current.map((item) =>
          item.qr.id === entry.qr.id ? { ...item, qr: { ...item.qr, is_active: entry.qr.is_active } } : item
        )
      );
      toast({ title: translateDataError(error.message, t), variant: "error" });
    }
  };

  const confirmRegenerate = async () => {
    if (!regenerating) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    const token = randomToken(24);
    const { data, error } = await supabase
      .from("qr_codes")
      .update({ token, is_active: true, scan_count: 0 })
      .eq("id", regenerating.qr.id)
      .select("*")
      .single();
    setBusy(false);

    if (error || !data) {
      toast({ title: translateDataError(error?.message, t), variant: "error" });
      return;
    }

    setEntries((current) => current.map((item) => (item.qr.id === data.id ? { ...item, qr: data } : item)));
    setRegenerating(null);
    toast({ title: t.common.success, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.qr.title}
        description={t.qr.subtitle}
        actions={
          entries.length > 0 ? (
            <Button variant="outline" asChild>
              <Link href="/dashboard/qr/print" target="_blank">
                <Printer aria-hidden />
                {t.qr.printAll}
              </Link>
            </Button>
          ) : null
        }
      />

      <Alert>
        <QrCode aria-hidden className="text-primary" />
        <AlertText className="text-foreground">{t.qr.stableNote}</AlertText>
      </Alert>

      {general.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">{t.qr.generalQr}</h2>
            <p className="text-xs text-muted-foreground">{t.qr.generalQrHelp}</p>
          </div>
          {general.map((entry) => (
            <QrRow key={entry.qr.id} entry={entry} onRegenerate={setRegenerating} onToggle={(item) => void toggle(item)} />
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t.qr.tableQr}</h2>

        {tableEntries.length === 0 ? (
          <div className="surface">
            <EmptyState
              icon={<QrCode />}
              title={t.qr.emptyTitle}
              description={t.qr.emptyText}
              action={
                can("tables:write") ? (
                  <Button asChild>
                    <Link href="/dashboard/tables">{t.tables.newTable}</Link>
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {tableEntries.map((entry) => (
              <QrRow
                key={entry.qr.id}
                entry={entry}
                onRegenerate={setRegenerating}
                onToggle={(item) => void toggle(item)}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(regenerating)}
        onOpenChange={(open) => !open && setRegenerating(null)}
        title={t.qr.regenerateTitle}
        description={t.qr.regenerateText}
        confirmLabel={t.qr.regenerate}
        loading={busy}
        onConfirm={confirmRegenerate}
      />
    </div>
  );
}
