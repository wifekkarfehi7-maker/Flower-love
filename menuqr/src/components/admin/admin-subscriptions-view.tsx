"use client";

import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertText, AlertTitle, EmptyState, PageHeader } from "@/components/ui/misc";
import { formatDate, formatNumber, formatPrice, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";

export interface AdminSubscriptionRow {
  restaurantId: string;
  restaurantName: string;
  slug: string;
  planCode: string | null;
  planName: string | null;
  status: SubscriptionStatus | null;
  periodEnd: string | null;
}

export function AdminSubscriptionsView({
  plans,
  breakdown,
  rows,
}: {
  plans: SubscriptionPlan[];
  breakdown: { planCode: string; planName: string; restaurants: number; active: number }[];
  rows: AdminSubscriptionRow[];
}) {
  const { t, locale } = useTranslation();

  const statusLabels: Record<SubscriptionStatus, string> = {
    active: t.subscription.statusActive,
    trialing: t.subscription.statusTrialing,
    past_due: t.subscription.statusPastDue,
    canceled: t.subscription.statusCanceled,
    expired: t.subscription.statusExpired,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.admin.subscriptions} />

      <Alert variant="warning">
        <CreditCard aria-hidden className="text-warning" />
        <div>
          <AlertTitle>{t.subscription.paymentNoticeTitle}</AlertTitle>
          <AlertText className="mt-1">{t.subscription.paymentNoticeText}</AlertText>
        </div>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const stats = breakdown.find((entry) => entry.planCode === plan.code);
          return (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{localized(plan, "name", locale)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {Number(plan.price_monthly) === 0
                    ? t.landing.pricingFree
                    : `${formatPrice(plan.price_monthly, plan.currency, locale)} ${t.subscription.perMonth}`}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{formatNumber(stats?.active ?? 0)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats?.restaurants ?? 0)} {t.admin.totalRestaurants}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.restaurants}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState title={t.admin.noResults} />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.restaurantId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.restaurantName}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      /{row.slug}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {row.periodEnd ? (
                      <span className="text-xs text-muted-foreground">
                        {t.subscription.renewsOn} {formatDate(row.periodEnd, locale)}
                      </span>
                    ) : null}
                    <Badge variant="neutral">{row.planCode ?? "—"}</Badge>
                    {row.status ? (
                      <Badge variant={row.status === "active" ? "success" : "warning"}>{statusLabels[row.status]}</Badge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
