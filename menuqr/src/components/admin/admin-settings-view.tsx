"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, Field, PageHeader } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { formatDateTime, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminAuditLogEntry, SubscriptionPlan } from "@/types/database";

interface PlanDraft {
  price_monthly: string;
  price_yearly: string;
  max_categories: string;
  max_products: string;
  max_tables: string;
  max_members: string;
  is_active: boolean;
}

function toDraft(plan: SubscriptionPlan): PlanDraft {
  return {
    price_monthly: String(plan.price_monthly),
    price_yearly: String(plan.price_yearly),
    max_categories: plan.max_categories == null ? "" : String(plan.max_categories),
    max_products: plan.max_products == null ? "" : String(plan.max_products),
    max_tables: plan.max_tables == null ? "" : String(plan.max_tables),
    max_members: plan.max_members == null ? "" : String(plan.max_members),
    is_active: plan.is_active,
  };
}

function parseLimit(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function AdminSettingsView({
  initialPlans,
  auditLog,
}: {
  initialPlans: SubscriptionPlan[];
  auditLog: (AdminAuditLogEntry & { actorEmail: string | null })[];
}) {
  const { t, locale } = useTranslation();
  const toast = useToast();

  const [plans, setPlans] = React.useState(initialPlans);
  const [drafts, setDrafts] = React.useState<Record<string, PlanDraft>>(() =>
    Object.fromEntries(initialPlans.map((plan) => [plan.id, toDraft(plan)]))
  );
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const update = (planId: string, patch: Partial<PlanDraft>) => {
    setDrafts((current) => ({ ...current, [planId]: { ...(current[planId] as PlanDraft), ...patch } }));
  };

  const save = async (plan: SubscriptionPlan) => {
    const draft = drafts[plan.id];
    if (!draft) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSavingId(plan.id);
    const { data, error } = await supabase
      .from("subscription_plans")
      .update({
        price_monthly: Number(draft.price_monthly.replace(",", ".")) || 0,
        price_yearly: Number(draft.price_yearly.replace(",", ".")) || 0,
        max_categories: parseLimit(draft.max_categories),
        max_products: parseLimit(draft.max_products),
        max_tables: parseLimit(draft.max_tables),
        max_members: parseLimit(draft.max_members),
        is_active: draft.is_active,
      })
      .eq("id", plan.id)
      .select("*")
      .single();
    setSavingId(null);

    if (error || !data) {
      toast({ title: translateDataError(error?.message, t), variant: "error" });
      return;
    }

    setPlans((current) => current.map((item) => (item.id === data.id ? data : item)));
    toast({ title: t.common.success, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.admin.settings} description={t.admin.plansHint} />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t.admin.plansTitle}</h2>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const draft = drafts[plan.id];
            if (!draft) return null;

            return (
              <Card key={plan.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{localized(plan, "name", locale)}</CardTitle>
                  <Badge variant="neutral">{plan.code}</Badge>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.admin.priceMonthly}>
                      <Input
                        dir="ltr"
                        inputMode="decimal"
                        className="h-9"
                        value={draft.price_monthly}
                        onChange={(event) => update(plan.id, { price_monthly: event.target.value })}
                      />
                    </Field>
                    <Field label={t.admin.priceYearly}>
                      <Input
                        dir="ltr"
                        inputMode="decimal"
                        className="h-9"
                        value={draft.price_yearly}
                        onChange={(event) => update(plan.id, { price_yearly: event.target.value })}
                      />
                    </Field>
                    <Field label={t.admin.limitCategories}>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        className="h-9"
                        value={draft.max_categories}
                        onChange={(event) => update(plan.id, { max_categories: event.target.value })}
                      />
                    </Field>
                    <Field label={t.admin.limitProducts}>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        className="h-9"
                        value={draft.max_products}
                        onChange={(event) => update(plan.id, { max_products: event.target.value })}
                      />
                    </Field>
                    <Field label={t.admin.limitTables}>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        className="h-9"
                        value={draft.max_tables}
                        onChange={(event) => update(plan.id, { max_tables: event.target.value })}
                      />
                    </Field>
                    <Field label={t.admin.limitMembers}>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        className="h-9"
                        value={draft.max_members}
                        onChange={(event) => update(plan.id, { max_members: event.target.value })}
                      />
                    </Field>
                  </div>

                  <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
                    <span className="text-sm">{t.common.active}</span>
                    <Switch
                      checked={draft.is_active}
                      onCheckedChange={(checked) => update(plan.id, { is_active: checked })}
                    />
                  </label>

                  <Button className="w-full" loading={savingId === plan.id} onClick={() => void save(plan)}>
                    {t.common.save}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.auditTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <EmptyState title={t.admin.noResults} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {auditLog.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="flex items-center gap-2">
                    <Badge variant="neutral">{entry.action}</Badge>
                    <span className="text-muted-foreground" dir="ltr">
                      {entry.actorEmail ?? "—"}
                    </span>
                  </span>
                  <time className="text-xs text-muted-foreground" dateTime={entry.created_at}>
                    {formatDateTime(entry.created_at, locale)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
