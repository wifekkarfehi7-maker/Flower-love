"use client";

import { BarChart3, Eye, QrCode, Users } from "lucide-react";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { loadAnalytics } from "@/lib/analytics/queries";
import type { AnalyticsBundle, RankedItem } from "@/lib/analytics/types";
import { formatDate, formatDateTime, formatNumber, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const RANGES = [7, 30, 90] as const;

function RankedList({ items, emptyLabel }: { items: RankedItem[]; emptyLabel: string }) {
  const { locale } = useTranslation();
  const { restaurant } = useRestaurant();
  const max = Math.max(...items.map((item) => item.views), 1);

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.id}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{localized(item, "name", locale, restaurant.default_language)}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatNumber(item.views)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.views / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsView({ initialData, initialDays }: { initialData: AnalyticsBundle; initialDays: number }) {
  const { t, locale } = useTranslation();
  const { restaurant } = useRestaurant();

  const [days, setDays] = React.useState(initialDays);
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => setData(initialData), [initialData]);

  const changeRange = async (nextDays: number) => {
    setDays(nextDays);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    setData(await loadAnalytics(supabase, restaurant.id, nextDays));
    setLoading(false);
  };

  const rangeLabels: Record<number, string> = {
    7: t.analytics.last7Days,
    30: t.analytics.last30Days,
    90: t.analytics.last90Days,
  };

  const chartData = data.timeseries.map((point) => ({
    ...point,
    label: formatDate(point.day, locale === "ar" ? "fr" : locale).replace(/\s\d{4}$/, ""),
  }));

  const hasData = data.summary.viewsTotal > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.analytics.title}
        description={t.analytics.subtitle}
        actions={
          <Select value={String(days)} onValueChange={(value) => void changeRange(Number(value))}>
            <SelectTrigger className="w-44" aria-label={t.common.select}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((range) => (
                <SelectItem key={range} value={String(range)}>
                  {rangeLabels[range]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t.analytics.scansToday} value={formatNumber(data.summary.scansToday)} icon={QrCode} tone="accent" />
        <StatCard label={t.analytics.scansWeek} value={formatNumber(data.summary.scansWeek)} icon={QrCode} />
        <StatCard label={t.analytics.totalViews} value={formatNumber(data.summary.viewsTotal)} icon={Eye} tone="primary" />
        <StatCard
          label={t.analytics.uniqueVisitors}
          value={formatNumber(data.summary.uniqueVisitorsMonth)}
          icon={Users}
          hint={t.analytics.last30Days}
        />
      </div>

      {!hasData ? (
        <div className="surface">
          <EmptyState icon={<BarChart3 />} title={t.analytics.emptyTitle} description={t.analytics.emptyText} />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t.analytics.viewsOverTime}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64" />
              ) : (
                // Charts stay LTR in every language: axes are dates and counts.
                <div dir="ltr" className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(174 77% 26%)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="hsl(174 77% 26%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 12% 90%)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: "1px solid hsl(40 12% 90%)", fontSize: 12 }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        name={t.analytics.views}
                        stroke="hsl(174 77% 26%)"
                        strokeWidth={2}
                        fill="url(#viewsFill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="scans"
                        name={t.analytics.scans}
                        stroke="hsl(38 92% 50%)"
                        strokeWidth={2}
                        fillOpacity={0}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.analytics.topProducts}</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedList items={data.topProducts} emptyLabel={t.analytics.emptyText} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.analytics.topCategories}</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedList items={data.topCategories} emptyLabel={t.analytics.emptyText} />
              </CardContent>
            </Card>
          </div>

          {data.tableActivity.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t.analytics.tableActivity}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div dir="ltr" className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.tableActivity} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 12% 90%)" vertical={false} />
                      <XAxis dataKey="tableName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                      <Tooltip
                        cursor={{ fill: "hsl(40 14% 96%)" }}
                        contentStyle={{ borderRadius: 12, border: "1px solid hsl(40 12% 90%)", fontSize: 12 }}
                      />
                      <Bar dataKey="scans" name={t.analytics.scans} radius={[6, 6, 0, 0]}>
                        {data.tableActivity.map((row) => (
                          <Cell key={row.tableId} fill="hsl(174 77% 26%)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ul className="divide-y divide-border text-sm">
                  {data.tableActivity.map((row) => (
                    <li key={row.tableId} className="flex items-center justify-between gap-3 py-2">
                      <span className="truncate">{row.tableName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {row.lastScan ? formatDateTime(row.lastScan, locale) : t.tables.neverScanned}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      <p className="text-xs text-muted-foreground">{t.analytics.privacyNote}</p>
    </div>
  );
}
