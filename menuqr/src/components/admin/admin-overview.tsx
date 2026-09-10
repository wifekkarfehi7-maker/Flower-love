"use client";

import { Eye, QrCode, Store, Table2, UtensilsCrossed, Users } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { formatNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";

export interface PlatformStats {
  totalRestaurants: number;
  activeRestaurants: number;
  suspendedRestaurants: number;
  newRestaurantsMonth: number;
  totalUsers: number;
  newUsersMonth: number;
  totalQrCodes: number;
  totalMenuViews: number;
  menuViewsMonth: number;
  totalProducts: number;
  totalTables: number;
}

export function AdminOverview({
  stats,
  breakdown,
}: {
  stats: PlatformStats;
  breakdown: { planCode: string; planName: string; restaurants: number; active: number }[];
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader title={t.admin.overview} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={t.admin.totalRestaurants}
          value={formatNumber(stats.totalRestaurants)}
          icon={Store}
          tone="primary"
          hint={`${formatNumber(stats.newRestaurantsMonth)} ${t.admin.newThisMonth}`}
        />
        <StatCard label={t.admin.activeRestaurants} value={formatNumber(stats.activeRestaurants)} icon={Store} />
        <StatCard
          label={t.admin.totalUsers}
          value={formatNumber(stats.totalUsers)}
          icon={Users}
          hint={`${formatNumber(stats.newUsersMonth)} ${t.admin.newThisMonth}`}
        />
        <StatCard label={t.admin.totalQrCodes} value={formatNumber(stats.totalQrCodes)} icon={QrCode} tone="accent" />
        <StatCard
          label={t.admin.totalViews}
          value={formatNumber(stats.totalMenuViews)}
          icon={Eye}
          hint={`${formatNumber(stats.menuViewsMonth)} ${t.admin.viewsThisMonth}`}
        />
        <StatCard label={t.admin.products} value={formatNumber(stats.totalProducts)} icon={UtensilsCrossed} />
        <StatCard label={t.admin.tables} value={formatNumber(stats.totalTables)} icon={Table2} />
        <StatCard label={t.admin.suspendedRestaurants} value={formatNumber(stats.suspendedRestaurants)} icon={Store} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.subscriptions}</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <EmptyState title={t.admin.noResults} />
          ) : (
            <ul className="divide-y divide-border">
              {breakdown.map((entry) => (
                <li key={entry.planCode} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium">{entry.planName}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(entry.active)} / {formatNumber(entry.restaurants)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
