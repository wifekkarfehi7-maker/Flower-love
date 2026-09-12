"use client";

import { Check, Info, Mail } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertText, AlertTitle, PageHeader } from "@/components/ui/misc";
import { whatsappLink } from "@/lib/config";
import { planFeatureKeys, planPrice, type BillingPeriod } from "@/lib/billing/provider";
import { formatDate, formatNumber, formatPrice, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { cn } from "@/lib/utils";
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from "@/types/database";

export interface UsageRow {
  used: number;
  limit: number | null;
}

export interface SubscriptionUsage {
  categories: UsageRow;
  products: UsageRow;
  tables: UsageRow;
  members: UsageRow;
}

function UsageBar({ label, usage, unlimitedLabel }: { label: string; usage: UsageRow; unlimitedLabel: string }) {
  const percent = usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {formatNumber(usage.used)} {usage.limit ? `/ ${formatNumber(usage.limit)}` : `· ${unlimitedLabel}`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", percent >= 90 ? "bg-warning" : "bg-primary")}
          style={{ width: usage.limit ? `${percent}%` : "100%", opacity: usage.limit ? 1 : 0.25 }}
        />
      </div>
    </div>
  );
}

export function SubscriptionView({
  plans,
  subscription,
  currentPlan,
  usage,
}: {
  plans: SubscriptionPlan[];
  subscription: Subscription | null;
  currentPlan: SubscriptionPlan | null;
  usage: SubscriptionUsage;
}) {
  const { t, locale } = useTranslation();
  const { restaurant } = useRestaurant();
  const [period, setPeriod] = React.useState<BillingPeriod>("monthly");

  const statusLabels: Record<SubscriptionStatus, string> = {
    active: t.subscription.statusActive,
    trialing: t.subscription.statusTrialing,
    past_due: t.subscription.statusPastDue,
    canceled: t.subscription.statusCanceled,
    expired: t.subscription.statusExpired,
  };

  const featureLabels = t.plans as Record<string, string>;

  // WhatsApp, opened with the venue already named: whoever answers knows which
  // café is asking without a round of "which restaurant is this?".
  const contactHref = whatsappLink(
    `${t.subscription.whatsappIntro}\n${restaurant.name} (${restaurant.slug})`
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t.subscription.title} description={t.subscription.subtitle} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.subscription.currentPlan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xl font-semibold">
                {currentPlan ? localized(currentPlan, "name", locale) : t.landing.pricingFree}
              </span>
              {subscription ? (
                <Badge variant={subscription.status === "active" ? "success" : "warning"}>
                  {statusLabels[subscription.status]}
                </Badge>
              ) : null}
            </div>

            {currentPlan ? (
              <p className="text-sm text-muted-foreground">
                {Number(currentPlan.price_monthly) === 0
                  ? t.landing.pricingFree
                  : `${formatPrice(currentPlan.price_monthly, currentPlan.currency, locale)} ${t.subscription.perMonth}`}
              </p>
            ) : null}

            {subscription?.current_period_end ? (
              <p className="text-sm text-muted-foreground">
                {t.subscription.renewsOn} {formatDate(subscription.current_period_end, locale)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.subscription.usage}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar label={t.subscription.categoriesUsed} usage={usage.categories} unlimitedLabel={t.common.unlimited} />
            <UsageBar label={t.subscription.productsUsed} usage={usage.products} unlimitedLabel={t.common.unlimited} />
            <UsageBar label={t.subscription.tablesUsed} usage={usage.tables} unlimitedLabel={t.common.unlimited} />
            <UsageBar label={t.subscription.membersUsed} usage={usage.members} unlimitedLabel={t.common.unlimited} />
          </CardContent>
        </Card>
      </div>

      <Alert variant="warning">
        <Info aria-hidden className="text-warning" />
        <div>
          <AlertTitle>{t.subscription.paymentNoticeTitle}</AlertTitle>
          <AlertText className="mt-1">{t.subscription.paymentNoticeText}</AlertText>
        </div>
      </Alert>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t.subscription.upgradeTitle}</h2>

          <div className="inline-flex rounded-full border border-border p-0.5" role="group">
            {(["monthly", "yearly"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                aria-pressed={period === option}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  period === option ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {option === "monthly" ? t.landing.pricingMonthly : t.landing.pricingYearly}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const price = planPrice(plan, period);

            return (
              <Card key={plan.id} className={cn("flex flex-col", isCurrent && "border-primary ring-1 ring-primary/20")}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{localized(plan, "name", locale)}</CardTitle>
                    {isCurrent ? <Badge>{t.subscription.currentPlanBadge}</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{localized(plan, "description", locale)}</p>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-2xl font-semibold tabular-nums">
                    {price === 0 ? (
                      t.landing.pricingFree
                    ) : (
                      <>
                        {formatPrice(price, plan.currency, locale)}
                        <span className="text-sm font-normal text-muted-foreground">
                          {period === "monthly" ? t.subscription.perMonth : t.subscription.perYear}
                        </span>
                      </>
                    )}
                  </p>

                  <ul className="flex-1 space-y-2 text-sm">
                    {planFeatureKeys(plan).map((key) => (
                      <li key={key} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        <span>{featureLabels[key] ?? key}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" disabled>
                      {t.subscription.currentPlanBadge}
                    </Button>
                  ) : (
                    <Button variant={price === 0 ? "outline" : "default"} asChild>
                      <a href={contactHref} target="_blank" rel="noopener noreferrer">
                        <Mail aria-hidden />
                        {t.subscription.contactToUpgrade}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
