"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { LocalizedFields } from "@/components/menu/localized-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { SITE_URL } from "@/lib/config";
import { locales, localeLabel, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/provider";
import { notifyMenuChanged } from "@/lib/menu/revalidate";
import { restaurantSchemas, type RestaurantGeneralValues } from "@/lib/restaurants/schemas";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const CURRENCIES = ["TND", "DZD", "MAD", "EGP", "SAR", "AED", "EUR", "USD"];

export function RestaurantGeneralForm() {
  const { t } = useTranslation();
  const { restaurant, setRestaurant, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("restaurant:write");
  const [formError, setFormError] = React.useState<string | null>(null);

  const schema = React.useMemo(() => restaurantSchemas(t).general, [t]);
  const form = useForm<RestaurantGeneralValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: restaurant.name,
      slug: restaurant.slug,
      restaurant_type: restaurant.restaurant_type ?? "",
      name_ar: restaurant.name_ar ?? "",
      name_fr: restaurant.name_fr ?? "",
      name_en: restaurant.name_en ?? "",
      description_ar: restaurant.description_ar ?? "",
      description_fr: restaurant.description_fr ?? "",
      description_en: restaurant.description_en ?? "",
      default_language: restaurant.default_language,
      available_languages: restaurant.available_languages ?? [...locales],
      currency: restaurant.currency,
      is_published: restaurant.is_published,
    },
  });

  const values = form.watch();

  const toggleLanguage = (locale: Locale) => {
    const current = values.available_languages ?? [];
    const next = current.includes(locale) ? current.filter((item) => item !== locale) : [...current, locale];
    if (next.length === 0) return;
    form.setValue("available_languages", next, { shouldDirty: true });
    if (!next.includes(values.default_language)) {
      form.setValue("default_language", next[0] as Locale, { shouldDirty: true });
    }
  };

  const onSubmit = form.handleSubmit(async (submitted) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const previousSlug = restaurant.slug;
    const { data, error } = await supabase
      .from("restaurants")
      .update({
        name: submitted.name,
        slug: submitted.slug,
        restaurant_type: submitted.restaurant_type || null,
        name_ar: submitted.name_ar || null,
        name_fr: submitted.name_fr || null,
        name_en: submitted.name_en || null,
        description_ar: submitted.description_ar || null,
        description_fr: submitted.description_fr || null,
        description_en: submitted.description_en || null,
        default_language: submitted.default_language,
        available_languages: submitted.available_languages,
        currency: submitted.currency,
        is_published: submitted.is_published,
      })
      .eq("id", restaurant.id)
      .select("*")
      .single();

    if (error || !data) {
      const message = translateDataError(error?.message, t);
      if (message === t.onboarding.slugTaken) {
        form.setError("slug", { message });
      } else {
        setFormError(message);
      }
      return;
    }

    setRestaurant(data);
    notifyMenuChanged(previousSlug);
    if (data.slug !== previousSlug) notifyMenuChanged(data.slug);
    toast({ title: t.restaurant.saved, variant: "success" });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{formError}</AlertText>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.restaurant.name} htmlFor="name" error={form.formState.errors.name?.message} required>
          <Input id="name" disabled={!canWrite} {...form.register("name")} />
        </Field>

        <Field
          label={t.restaurant.slug}
          htmlFor="slug"
          error={form.formState.errors.slug?.message}
          hint={`${SITE_URL}/menu/${values.slug || "…"}`}
          required
        >
          <Input id="slug" dir="ltr" className="font-mono text-sm" disabled={!canWrite} {...form.register("slug")} />
        </Field>
      </div>

      {values.slug !== restaurant.slug ? (
        <Alert variant="warning">
          <AlertText className="text-foreground">{t.restaurant.slugWarning}</AlertText>
        </Alert>
      ) : null}

      <LocalizedFields
        register={form.register}
        errors={form.formState.errors}
        values={values}
        defaultLocale={restaurant.default_language}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.restaurant.currency} htmlFor="currency">
          <Select
            value={values.currency}
            onValueChange={(value) => form.setValue("currency", value, { shouldDirty: true })}
            disabled={!canWrite}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t.restaurant.defaultLanguage} htmlFor="default_language">
          <Select
            value={values.default_language}
            onValueChange={(value) => form.setValue("default_language", value as Locale, { shouldDirty: true })}
            disabled={!canWrite}
          >
            <SelectTrigger id="default_language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(values.available_languages ?? locales).map((locale) => (
                <SelectItem key={locale} value={locale}>
                  {localeLabel[locale]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label={t.restaurant.availableLanguages}>
        <div className="flex flex-wrap gap-2">
          {locales.map((locale) => {
            const checked = (values.available_languages ?? []).includes(locale);
            return (
              <button
                key={locale}
                type="button"
                disabled={!canWrite}
                onClick={() => toggleLanguage(locale)}
                aria-pressed={checked}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  checked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {localeLabel[locale]}
              </button>
            );
          })}
        </div>
      </Field>

      <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <span>
          <span className="block text-sm font-medium">{t.restaurant.published}</span>
          <span className="block text-xs text-muted-foreground">{t.restaurant.publishedHelp}</span>
        </span>
        <Switch
          checked={values.is_published}
          disabled={!canWrite}
          onCheckedChange={(checked) => form.setValue("is_published", checked, { shouldDirty: true })}
        />
      </label>

      {canWrite ? (
        <Button type="submit" loading={form.formState.isSubmitting}>
          {t.common.save}
        </Button>
      ) : null}
    </form>
  );
}
