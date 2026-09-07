"use client";

import { Ban, CheckCircle2, MoreVertical, Search, Shield, ShieldOff, Users } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useAuth } from "@/lib/auth/provider";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlatformRole } from "@/types/database";

export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: PlatformRole;
  isSuspended: boolean;
  createdAt: string;
  restaurantCount: number;
  totalCount: number;
}

const PAGE_SIZE = 20;

export function AdminUsersView({ initialRows }: { initialRows: AdminUserRow[] }) {
  const { t, locale } = useTranslation();
  const { profile } = useAuth();
  const toast = useToast();

  const [rows, setRows] = React.useState(initialRows);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const total = rows[0]?.totalCount ?? 0;

  const fetchRows = React.useCallback(
    async (nextSearch: string, nextPage: number) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      setLoading(true);
      const { data, error } = await supabase.rpc("admin_users", {
        p_search: nextSearch || null,
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
          email: row.email,
          fullName: row.full_name,
          phone: row.phone,
          role: row.platform_role,
          isSuspended: row.is_suspended,
          createdAt: row.created_at,
          restaurantCount: Number(row.restaurant_count ?? 0),
          totalCount: Number(row.total_count ?? 0),
        }))
      );
    },
    [t, toast]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      void fetchRows(search, 0);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setRole = async (row: AdminUserRow, role: PlatformRole) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase.rpc("admin_set_user_role", { p_user: row.id, p_role: role });
    if (error) {
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, role } : item)));
    toast({ title: t.common.success, variant: "success" });
  };

  const setSuspended = async (row: AdminUserRow, suspended: boolean) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase.rpc("admin_set_user_suspended", { p_user: row.id, p_suspended: suspended });
    if (error) {
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isSuspended: suspended } : item)));
    toast({ title: t.common.success, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.admin.users} />

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.admin.searchUsers}
          className="ps-9"
          aria-label={t.common.search}
        />
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : rows.length === 0 ? (
        <div className="surface">
          <EmptyState icon={<Users />} title={t.admin.noResults} />
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const isSelf = row.id === profile?.id;
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {(row.fullName ?? row.email ?? "?").slice(0, 1).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {row.fullName ?? row.email}
                    {row.role === "super_admin" ? <Badge variant="warning">{t.admin.roleSuperAdmin}</Badge> : null}
                    {row.isSuspended ? <Badge variant="destructive">{t.admin.suspendUser}</Badge> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">
                    {row.email}
                    {row.phone ? ` · ${row.phone}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 gap-4 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {formatNumber(row.restaurantCount)} {t.admin.restaurantsOfUser}
                  </span>
                  <span className="hidden sm:inline">{formatDate(row.createdAt, locale)}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="iconSm" aria-label={t.common.actions} disabled={isSelf}>
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {row.role === "super_admin" ? (
                      <DropdownMenuItem onSelect={() => void setRole(row, "user")}>
                        <ShieldOff aria-hidden />
                        {t.admin.removeAdmin}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => void setRole(row, "super_admin")}>
                        <Shield aria-hidden />
                        {t.admin.makeAdmin}
                      </DropdownMenuItem>
                    )}

                    {row.isSuspended ? (
                      <DropdownMenuItem onSelect={() => void setSuspended(row, false)}>
                        <CheckCircle2 aria-hidden />
                        {t.admin.activateUser}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem destructive onSelect={() => void setSuspended(row, true)}>
                        <Ban aria-hidden />
                        {t.admin.suspendUser}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => {
              setPage(page - 1);
              void fetchRows(search, page - 1);
            }}
          >
            {t.common.previous}
          </Button>
          <span className="text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} {t.common.of} {formatNumber(total)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => {
              setPage(page + 1);
              void fetchRows(search, page + 1);
            }}
          >
            {t.common.next}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
