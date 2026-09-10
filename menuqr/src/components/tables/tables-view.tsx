"use client";

import { LayoutGrid, MoreVertical, Pencil, Plus, QrCode, Table2, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { DragHandle, SortableList } from "@/components/shared/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { formatNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { RestaurantTable } from "@/types/database";
import { BulkTablesDialog } from "./bulk-tables-dialog";
import { TableDialog } from "./table-dialog";

export interface TableWithScans extends RestaurantTable {
  scanCount: number;
}

export function TablesView({ initialTables }: { initialTables: TableWithScans[] }) {
  const { t } = useTranslation();
  const { can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("tables:write");

  const [tables, setTables] = React.useState(initialTables);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RestaurantTable | null>(null);
  const [deleting, setDeleting] = React.useState<RestaurantTable | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  React.useEffect(() => setTables(initialTables), [initialTables]);

  const handleSaved = (saved: RestaurantTable) => {
    setTables((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => (item.id === saved.id ? { ...saved, scanCount: item.scanCount } : item))
        : [...current, { ...saved, scanCount: 0 }];
    });
  };

  const persistOrder = async (ordered: TableWithScans[]) => {
    const previous = tables;
    setTables(ordered);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updates = ordered
      .map((table, index) => ({ table, sortOrder: index + 1 }))
      .filter(({ table, sortOrder }) => table.sort_order !== sortOrder);

    const results = await Promise.all(
      updates.map(({ table, sortOrder }) =>
        supabase.from("restaurant_tables").update({ sort_order: sortOrder }).eq("id", table.id)
      )
    );

    if (results.some((result) => result.error)) {
      setTables(previous);
      toast({ title: t.errors.saveFailed, variant: "error" });
    }
  };

  const toggleActive = async (table: TableWithScans) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const next = !table.is_active;
    setTables((current) => current.map((item) => (item.id === table.id ? { ...item, is_active: next } : item)));

    const { error } = await supabase.from("restaurant_tables").update({ is_active: next }).eq("id", table.id);
    if (error) {
      setTables((current) =>
        current.map((item) => (item.id === table.id ? { ...item, is_active: table.is_active } : item))
      );
      toast({ title: translateDataError(error.message, t), variant: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setDeleteBusy(true);
    const [{ error }] = await Promise.all([
      supabase
        .from("restaurant_tables")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", deleting.id),
      // A retired table's printed code must stop resolving.
      supabase.from("qr_codes").update({ is_active: false }).eq("table_id", deleting.id),
    ]);
    setDeleteBusy(false);

    if (error) {
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    setTables((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    toast({ title: t.common.success, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.tables.title}
        description={t.tables.subtitle}
        actions={
          canWrite ? (
            <>
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <LayoutGrid aria-hidden />
                {t.tables.addBulk}
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus aria-hidden />
                {t.tables.newTable}
              </Button>
            </>
          ) : null
        }
      />

      {tables.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<Table2 />}
            title={t.tables.emptyTitle}
            description={t.tables.emptyText}
            action={
              canWrite ? (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus aria-hidden />
                  {t.tables.newTable}
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <SortableList
          items={tables}
          onReorder={(ordered) => void persistOrder(ordered)}
          disabled={!canWrite}
          className="space-y-2"
        >
          {(table, handle) => (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card",
                !table.is_active && "opacity-70"
              )}
            >
              {canWrite ? <DragHandle handle={handle} label={t.categories.reorderHint} /> : null}

              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                <Table2 className="size-5" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                  {table.name}
                  {table.zone ? <Badge variant="neutral">{table.zone}</Badge> : null}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
                  {table.identifier}
                  {table.seats ? ` · ${table.seats} ${t.tables.seats}` : ""}
                </p>
              </div>

              <div className="hidden shrink-0 text-end sm:block">
                <p className="text-sm font-semibold tabular-nums">{formatNumber(table.scanCount)}</p>
                <p className="text-xs text-muted-foreground">{t.tables.scans}</p>
              </div>

              {canWrite ? (
                <Switch
                  checked={table.is_active}
                  onCheckedChange={() => void toggleActive(table)}
                  aria-label={t.common.active}
                  className="shrink-0"
                />
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="iconSm" aria-label={t.common.actions}>
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/qr">
                      <QrCode aria-hidden />
                      {t.tables.viewQr}
                    </Link>
                  </DropdownMenuItem>
                  {canWrite ? (
                    <>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(table);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil aria-hidden />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onSelect={() => setDeleting(table)}>
                        <Trash2 aria-hidden />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </SortableList>
      )}

      <TableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        table={editing}
        nextSortOrder={tables.length + 1}
        onSaved={handleSaved}
      />

      <BulkTablesDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        existingIdentifiers={tables.map((table) => table.identifier)}
        nextSortOrder={tables.length + 1}
        onCreated={(created) =>
          setTables((current) => [...current, ...created.map((table) => ({ ...table, scanCount: 0 }))])
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t.tables.deleteTitle}
        description={t.tables.deleteText}
        confirmLabel={t.common.delete}
        loading={deleteBusy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
