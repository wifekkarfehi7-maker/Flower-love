"use client";

import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Eye,
  Plus,
  QrCode,
  Table2,
  Tags,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertText, AlertTitle, EmptyState } from "@/components/ui/misc";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { StatCard } from "./stat-card";

export interface OverviewData {
  viewsToday: number;
  scansToday: number;
  viewsWeek: number;
  productCount: number;
  categoryCount: number;
  tableCount: number;
  recentViews: { id: string; viewed_at: string; source: string; tableName: string | null }[];
}

export function OverviewView({ data, ownerName }: { data: OverviewData; ownerName: string | null }) {
  const { t } = useTranslation();
  const { restaurant, can, setRestaurant, refresh } = useRestaurant();
  const [publishing, setPublishing] = React.useState(false);

  const checklist = [
    { done: data.categoryCount > 0, label: t.dashboard.checklistCategory, href: "/dashboard/categories" },
    { done: data.productCount > 0, label: t.dashboard.checklistProduct, href: "/dashboard/products" },
    { done: data.tableCount > 0, label: t.dashboard.checklistTable, href: "/dashboard/tables" },
    { done: Boolean(restaurant.logo_url), label: t.dashboard.checklistBranding, href: "/dashboard/restaurant" },
    { done: restaurant.is_published, label: t.dashboard.checklistPublish, href: "/dashboard/restaurant" },
  ];
  const remaining = checklist.filter((item) => !item.done);

  const publish = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setPublishing(true);
    const { error } = await supabase.from("restaurants").update({ is_published: true }).eq("id", restaurant.id);
    if (!error) {
      setRestaurant((current) => ({ ...current, is_published: true }));
      refresh();
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t.dashboard.welcomeBack}
          {ownerName ? `، ${ownerName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.dashboard.todayOverview}</p>
      </div>

      {restaurant.status === "suspended" ? (
        <Alert variant="destructive">
          <div>
            <AlertTitle>{t.dashboard.suspendedTitle}</AlertTitle>
            <AlertText className="mt-1">{restaurant.suspended_reason ?? t.dashboard.suspendedText}</AlertText>
          </div>
        </Alert>
      ) : !restaurant.is_published ? (
        <Alert variant="warning" className="items-center justify-between gap-4 sm:flex">
          <AlertText className="text-foreground">{t.dashboard.menuOfflineWarning}</AlertText>
          {can("restaurant:write") ? (
            <Button size="sm" className="mt-3 sm:mt-0" loading={publishing} onClick={() => void publish()}>
              {t.dashboard.publishNow}
            </Button>
          ) : null}
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label={t.dashboard.menuViews} value={formatNumber(data.viewsToday)} icon={Eye} tone="primary" hint={t.common.today} />
        <StatCard label={t.dashboard.qrScans} value={formatNumber(data.scansToday)} icon={QrCode} tone="accent" hint={t.common.today} />
        <StatCard label={t.dashboard.productsCount} value={formatNumber(data.productCount)} icon={UtensilsCrossed} />
        <StatCard label={t.dashboard.categoriesCount} value={formatNumber(data.categoryCount)} icon={Tags} />
        <StatCard label={t.dashboard.tablesCount} value={formatNumber(data.tableCount)} icon={Table2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {remaining.length > 0 ? (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{t.dashboard.setupChecklist}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {checklist.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted"
                >
                  {item.done ? (
                    <CheckCircle2 className="size-[18px] shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className={remaining.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/analytics">
                {t.dashboard.analytics}
                <ArrowRight className="rtl-flip" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentViews.length === 0 ? (
              <EmptyState icon={<Eye />} title={t.analytics.emptyTitle} description={t.dashboard.noActivity} />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentViews.map((view) => (
                  <li key={view.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      {view.source === "qr" ? (
                        <QrCode className="size-4 shrink-0 text-primary" aria-hidden />
                      ) : (
                        <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <span className="truncate">
                        {view.tableName ? `${t.menu.tableLabel} · ${view.tableName}` : t.dashboard.menuViews}
                      </span>
                    </span>
                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={view.viewed_at}>
                      {formatDateTime(view.viewed_at, "fr")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {can("menu:write") ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/products">
                <Plus aria-hidden />
                {t.dashboard.addProduct}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/categories">
                <Plus aria-hidden />
                {t.dashboard.addCategory}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/tables">
                <Plus aria-hidden />
                {t.dashboard.addTable}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
