"use client";

import * as React from "react";
import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";

import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localeDirection, localeLabel, locales, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/provider";

export interface LocalizedValues {
  name_ar?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
}

/**
 * One tab per language rather than six stacked inputs: owners fill in the
 * language they think in, and a dot marks which translations are still empty.
 * Each field keeps its own text direction, so Arabic names stay RTL even
 * inside an English dashboard.
 */
export function LocalizedFields<TValues extends FieldValues>({
  register,
  errors,
  values,
  withDescription = true,
  defaultLocale,
  namePlaceholder,
}: {
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
  values: LocalizedValues;
  withDescription?: boolean;
  defaultLocale: Locale;
  namePlaceholder?: string;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState<Locale>(defaultLocale);

  const nameLabels: Record<Locale, string> = {
    ar: t.products.nameAr,
    fr: t.products.nameFr,
    en: t.products.nameEn,
  };
  const descriptionLabels: Record<Locale, string> = {
    ar: t.products.descriptionAr,
    fr: t.products.descriptionFr,
    en: t.products.descriptionEn,
  };

  const localizedErrors = errors as FieldErrors<LocalizedValues>;
  const nameError =
    localizedErrors.name_ar?.message ?? localizedErrors.name_fr?.message ?? localizedErrors.name_en?.message;

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as Locale)}>
      <TabsList>
        {locales.map((locale) => (
          <TabsTrigger key={locale} value={locale} className="gap-1.5">
            {localeLabel[locale]}
            <span
              aria-hidden
              className={`size-1.5 rounded-full ${values[`name_${locale}`]?.trim() ? "bg-success" : "bg-sand-300"}`}
            />
          </TabsTrigger>
        ))}
      </TabsList>

      {locales.map((locale) => (
        <TabsContent key={locale} value={locale} className="mt-4 space-y-4">
          <Field
            label={nameLabels[locale]}
            htmlFor={`name_${locale}`}
            error={locale === defaultLocale ? (nameError as string | undefined) : undefined}
          >
            <Input
              id={`name_${locale}`}
              dir={localeDirection[locale]}
              placeholder={namePlaceholder}
              {...register(`name_${locale}` as Path<TValues>)}
            />
          </Field>

          {withDescription ? (
            <Field label={descriptionLabels[locale]} htmlFor={`description_${locale}`}>
              <Textarea
                id={`description_${locale}`}
                dir={localeDirection[locale]}
                rows={3}
                {...register(`description_${locale}` as Path<TValues>)}
              />
            </Field>
          ) : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
