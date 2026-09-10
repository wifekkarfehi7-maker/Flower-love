"use client";

import { Ban, CheckCircle2, ExternalLink, MoreVertical, Search, Store } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EmptyState, Field, PageHeader } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RestaurantStatus } from "@/types/database";

export interface AdminRestaurantRow {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  isPublished: boolean;
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  planCode: string | null;
  productCount: number;
  tableCount: number;
  viewCount: number;
  totalCount: number;
}

const PAGE_SIZE = 20;

export function AdminRestaurantsView({
  initialRows,
  planCodes,
}: {
  initialRows: AdminRestaurantRow[];
  planCodes: string[];
}) {
  const { t, locale } = useTranslation();
  const toast = useToast();

  const [rows, setRows] = React.useState(initialRows);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [suspending, setSuspending] = React.useState<AdminRestaurantRow | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const total = rows[0]?.totalCount ?? 0;

  const fetchRows = React.useCallback(
    async (nextSearch: string, nextStatus: string, nextPage: number) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      setLoading(true);
      const { data, error } = await supabase.rpc("admin_restaurants", {
        p_search: nextSearch || null,
        p_status: nextStatus === "all" ? null : nextStatus,
        p_limit: PAGE_SIZE,
        p_offset: nextPage * PAGE_SIZE,
      });
      setLoading(false);

      if (error) {
        toast({ title: translateDataError(error.message, t), variant: "error" });
        return;
      }

      setRows(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          status: row.status,
          isPublished: row.is_published,
          createdAt: row.created_at,
          ownerEmail: row.owner_email,
          ownerName: row.owner_name,
          planCode: row.plan_code,
          productCount: Number(row.product_count ?? 0),
          tableCount: Number(row.table_count ?? 0),
          viewCount: Number(row.view_count ?? 0),
          totalCount: Number(row.total_count ?? 0),
        }))
      );
    },
    [t, toast]
  );

  // Debounced so typing a venue name doesn't fire a query per keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      void fetchRows(search, status, 0);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    void fetchRows(search, status, nextPage);
  };

  const setRestaurantStatus = async (row: AdminRestaurantRow, nextStatus: RestaurantStatus, note?: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    const { error } = await supabase.rpc("admin_set_restaurant_status", {
      p_restaurant: row.id,
      p_status: nextStatus,
      p_reason: note ?? null,
    });
    setBusy(false);

    if (error) {
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)));
    setSuspending(null);
    setReason("");
    toast({ title: t.common.success, variant: "success" });
  };

  const changePlan = async (row: AdminRestaurantRow, planCode: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase.rpc("admin_set_restaurant_plan", {
      p_restaurant: row.id,
      p_plan_code: planCode,
      p_status: "active",
    });

    if (error) {
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, planCode } : item)));
    toast({ title: t.common.success, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.admin.restaurants} />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.admin.searchRestaurants}
            className="ps-9"
            aria-label={t.common.search}
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44" aria-label={t.common.status}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.all}</SelectItem>
            <SelectItem value="active">{t.common.active}</SelectItem>
            <SelectItem value="suspended">{t.admin.suspendedRestaurants}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <div className="surface">
          <EmptyState icon={<Store />} title={t.admin.noResults} />
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {row.name}
                  <Badge variant={row.status === "active" ? "success" : "destructive"}>
                    {row.status === "active" ? t.common.active : t.admin.suspendedRestaurants}
                  </Badge>
                  {row.planCode ? <Badge variant="neutral">{row.planCode}</Badge> : null}
                  {!row.isPublished ? <Badge variant="warning">{t.categories.hidden}</Badge> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  /{row.slug} · {row.ownerEmail ?? row.ownerName ?? "—"}
                </p>
              </div>

              <div className="flex shrink-0 gap-4 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {formatNumber(row.productCount)} {t.admin.products}
                </span>
                <span className="tabular-nums">
                  {formatNumber(row.tableCount)} {t.admin.tables}
                </span>
                <span className="tabular-nums">
                  {formatNumber(row.viewCount)} {t.admin.views}
                </span>
                <span className="hidden sm:inline">{formatDate(row.createdAt, locale)}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="iconSm" aria-label={t.common.actions}>
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`/menu/${row.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="rtl-flip" aria-hidden />
                      {t.dashboard.viewPublicMenu}
                    </a>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t.admin.changePlan}</DropdownMenuLabel>
                  {planCodes.map((code) => (
                    <DropdownMenuItem key={code} onSelect={() => void changePlan(row, code)}>
                      {code === row.planCode ? <CheckCircle2 className="text-primary" aria-hidden /> : null}
                      {code}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  {row.status === "active" ? (
                    <DropdownMenuItem destructive onSelect={() => setSuspending(row)}>
                      <Ban aria-hidden />
                      {t.admin.suspend}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => void setRestaurantStatus(row, "active")}>
                      <CheckCircle2 aria-hidden />
                      {t.admin.activate}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => changePage(page - 1)}>
            {t.common.previous}
          </Button>
          <span className="text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} {t.common.of} {formatNumber(total)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => changePage(page + 1)}
          >
            {t.common.next}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(suspending)}
        onOpenChange={(open) => !open && setSuspending(null)}
        title={t.admin.suspendTitle}
        description={t.admin.suspendText}
        confirmLabel={t.admin.suspend}
        loading={busy}
        onConfirm={async () => {
          if (suspending) await setRestaurantStatus(suspending, "suspended", reason);
        }}
      >
        <Field label={t.admin.suspendReason}>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
