"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { localeDirection, localeLabel, locales } from "@/lib/i18n/config";
import { currencySymbol, formatPrice, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { parseAmount } from "@/lib/menu/mappers";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Product, ProductOption, ProductOptionGroup } from "@/types/database";

interface GroupWithOptions extends ProductOptionGroup {
  options: ProductOption[];
}

const emptyNames = { name_ar: "", name_fr: "", name_en: "" };

function LocalizedNameInputs({
  values,
  onChange,
  idPrefix,
}: {
  values: typeof emptyNames;
  onChange: (values: typeof emptyNames) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {locales.map((locale) => (
        <div key={locale}>
          <label htmlFor={`${idPrefix}-${locale}`} className="mb-1 block text-xs text-muted-foreground">
            {localeLabel[locale]}
          </label>
          <Input
            id={`${idPrefix}-${locale}`}
            dir={localeDirection[locale]}
            className="h-9"
            value={values[`name_${locale}`]}
            onChange={(event) => onChange({ ...values, [`name_${locale}`]: event.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

export function ProductOptionsEditor({ product }: { product: Product }) {
  const { t, locale } = useTranslation();
  const { restaurant } = useRestaurant();
  const toast = useToast();

  const [groups, setGroups] = React.useState<GroupWithOptions[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [creatingGroup, setCreatingGroup] = React.useState(false);
  const [groupNames, setGroupNames] = React.useState(emptyNames);
  const [groupRequired, setGroupRequired] = React.useState(false);
  const [groupMin, setGroupMin] = React.useState("0");
  const [groupMax, setGroupMax] = React.useState("1");

  const [optionDrafts, setOptionDrafts] = React.useState<Record<string, { names: typeof emptyNames; price: string }>>({});

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const [groupsResult, optionsResult] = await Promise.all([
        supabase
          .from("product_option_groups")
          .select("*")
          .eq("product_id", product.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("product_options")
          .select("*")
          .eq("restaurant_id", product.restaurant_id)
          .order("sort_order", { ascending: true }),
      ]);

      if (cancelled) return;

      if (groupsResult.error) {
        setError(t.errors.loadFailed);
        setLoading(false);
        return;
      }

      const optionsByGroup = new Map<string, ProductOption[]>();
      for (const option of optionsResult.data ?? []) {
        const list = optionsByGroup.get(option.group_id) ?? [];
        list.push(option);
        optionsByGroup.set(option.group_id, list);
      }

      setGroups((groupsResult.data ?? []).map((group) => ({ ...group, options: optionsByGroup.get(group.id) ?? [] })));
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [product.id, product.restaurant_id, t]);

  const resetGroupForm = () => {
    setGroupNames(emptyNames);
    setGroupRequired(false);
    setGroupMin("0");
    setGroupMax("1");
    setCreatingGroup(false);
  };

  const addGroup = async () => {
    const hasName = Object.values(groupNames).some((value) => value.trim());
    if (!hasName) {
      setError(t.validation.atLeastOneName);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("product_option_groups")
      .insert({
        restaurant_id: product.restaurant_id,
        product_id: product.id,
        name_ar: groupNames.name_ar.trim() || null,
        name_fr: groupNames.name_fr.trim() || null,
        name_en: groupNames.name_en.trim() || null,
        is_required: groupRequired,
        min_select: Math.max(0, Number(groupMin) || 0),
        max_select: Math.max(1, Number(groupMax) || 1),
        sort_order: groups.length + 1,
      })
      .select("*")
      .single();
    setBusy(false);

    if (insertError || !data) {
      setError(translateDataError(insertError?.message, t));
      return;
    }

    setGroups((current) => [...current, { ...data, options: [] }]);
    resetGroupForm();
  };

  const deleteGroup = async (groupId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error: deleteError } = await supabase.from("product_option_groups").delete().eq("id", groupId);
    if (deleteError) {
      toast({ title: translateDataError(deleteError.message, t), variant: "error" });
      return;
    }
    setGroups((current) => current.filter((group) => group.id !== groupId));
  };

  const addOption = async (group: GroupWithOptions) => {
    const draft = optionDrafts[group.id] ?? { names: emptyNames, price: "" };
    const hasName = Object.values(draft.names).some((value) => value.trim());
    if (!hasName) {
      setError(t.validation.atLeastOneName);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("product_options")
      .insert({
        restaurant_id: product.restaurant_id,
        group_id: group.id,
        name_ar: draft.names.name_ar.trim() || null,
        name_fr: draft.names.name_fr.trim() || null,
        name_en: draft.names.name_en.trim() || null,
        price_delta: parseAmount(draft.price),
        sort_order: group.options.length + 1,
      })
      .select("*")
      .single();
    setBusy(false);

    if (insertError || !data) {
      setError(translateDataError(insertError?.message, t));
      return;
    }

    setGroups((current) =>
      current.map((item) => (item.id === group.id ? { ...item, options: [...item.options, data] } : item))
    );
    setOptionDrafts((current) => ({ ...current, [group.id]: { names: emptyNames, price: "" } }));
  };

  const deleteOption = async (groupId: string, optionId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error: deleteError } = await supabase.from("product_options").delete().eq("id", optionId);
    if (deleteError) {
      toast({ title: translateDataError(deleteError.message, t), variant: "error" });
      return;
    }

    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, options: group.options.filter((option) => option.id !== optionId) } : group
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.products.optionsSubtitle}</p>

      {error ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{error}</AlertText>
        </Alert>
      ) : null}

      {groups.length === 0 && !creatingGroup ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t.products.noOptions}
        </p>
      ) : null}

      {groups.map((group) => {
        const draft = optionDrafts[group.id] ?? { names: emptyNames, price: "" };
        return (
          <div key={group.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {localized(group, "name", locale, restaurant.default_language)}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {group.is_required ? <Badge variant="default">{t.products.groupRequired}</Badge> : null}
                  <span>
                    {group.min_select}–{group.max_select}
                  </span>
                </p>
              </div>
              <Button variant="ghost" size="iconSm" onClick={() => void deleteGroup(group.id)} aria-label={t.common.delete}>
                <Trash2 className="text-destructive" />
              </Button>
            </div>

            {group.options.length > 0 ? (
              <ul className="mt-3 divide-y divide-border border-t border-border">
                {group.options.map((option) => (
                  <li key={option.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate">{localized(option, "name", locale, restaurant.default_language)}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums text-muted-foreground">
                        {option.price_delta > 0 ? "+" : ""}
                        {formatPrice(option.price_delta, restaurant.currency, locale)}
                      </span>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => void deleteOption(group.id, option.id)}
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3 space-y-2 rounded-md bg-muted/50 p-2">
              <LocalizedNameInputs
                idPrefix={`option-${group.id}`}
                values={draft.names}
                onChange={(names) => setOptionDrafts((current) => ({ ...current, [group.id]: { ...draft, names } }))}
              />
              <div className="flex items-end gap-2">
                <Field label={`${t.products.optionPrice} (${currencySymbol(restaurant.currency, locale)})`} className="flex-1">
                  <Input
                    dir="ltr"
                    inputMode="decimal"
                    className="h-9"
                    placeholder="2.000"
                    value={draft.price}
                    onChange={(event) =>
                      setOptionDrafts((current) => ({ ...current, [group.id]: { ...draft, price: event.target.value } }))
                    }
                  />
                </Field>
                <Button type="button" size="sm" loading={busy} onClick={() => void addOption(group)}>
                  <Plus aria-hidden />
                  {t.products.addOption}
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {creatingGroup ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <Field label={t.products.groupName}>
            <LocalizedNameInputs idPrefix="new-group" values={groupNames} onChange={setGroupNames} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t.products.groupMin}>
              <Input
                type="number"
                min={0}
                max={20}
                className="h-9"
                value={groupMin}
                onChange={(event) => setGroupMin(event.target.value)}
              />
            </Field>
            <Field label={t.products.groupMax}>
              <Input
                type="number"
                min={1}
                max={20}
                className="h-9"
                value={groupMax}
                onChange={(event) => setGroupMax(event.target.value)}
              />
            </Field>
            <label className="flex items-end justify-between gap-2 pb-1">
              <span className="text-sm font-medium">{t.products.groupRequired}</span>
              <Switch checked={groupRequired} onCheckedChange={setGroupRequired} />
            </label>
          </div>

          <div className="flex gap-2">
            <Button size="sm" loading={busy} onClick={() => void addGroup()}>
              {t.common.save}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetGroupForm}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setCreatingGroup(true)}>
          <Plus aria-hidden />
          {t.products.addOptionGroup}
        </Button>
      )}
    </div>
  );
}
