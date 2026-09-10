"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translateDataError } from "@/lib/auth/error-map";
import { SITE_URL } from "@/lib/config";
import { locales, localeLabel, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/provider";
import { restaurantSchemas, type CreateRestaurantValues } from "@/lib/restaurants/schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

const RESTAURANT_TYPES = ["cafe", "restaurant", "fast_food", "bakery", "other"] as const;

export function OnboardingWizard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [restaurantId, setRestaurantId] = React.useState<string | null>(null);
  const [restaurantLanguage, setRestaurantLanguage] = React.useState<Locale>("ar");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [categoryName, setCategoryName] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [finishing, setFinishing] = React.useState(false);
  const [slugEdited, setSlugEdited] = React.useState(false);

  const typeLabels: Record<(typeof RESTAURANT_TYPES)[number], string> = {
    cafe: t.onboarding.typeCafe,
    restaurant: t.onboarding.typeRestaurant,
    fast_food: t.onboarding.typeFastFood,
    bakery: t.onboarding.typeBakery,
    other: t.onboarding.typeOther,
  };

  const schema = React.useMemo(() => restaurantSchemas(t).create, [t]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateRestaurantValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", restaurant_type: "cafe", default_language: "ar" },
  });

  const slug = watch("slug");

  const createRestaurant = handleSubmit(async (values) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        owner_id: userId,
        name: values.name,
        slug: values.slug,
        restaurant_type: values.restaurant_type ?? null,
        default_language: values.default_language,
        name_ar: values.default_language === "ar" ? values.name : null,
        name_fr: values.default_language === "fr" ? values.name : null,
        name_en: values.default_language === "en" ? values.name : null,
      })
      .select("id, default_language")
      .single();

    if (error || !data) {
      const message = translateDataError(error?.message, t);
      if (message === t.onboarding.slugTaken) {
        setError("slug", { message });
      } else {
        setFormError(message);
      }
      return;
    }

    setRestaurantId(data.id);
    setRestaurantLanguage(data.default_language);
    setStep(2);
  });

  const finish = async () => {
    if (!restaurantId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setFinishing(true);
    setFormError(null);

    if (logoUrl) {
      await supabase.from("restaurants").update({ logo_url: logoUrl }).eq("id", restaurantId);
    }

    const trimmedCategory = categoryName.trim();
    if (trimmedCategory) {
      const { error } = await supabase.from("categories").insert({
        restaurant_id: restaurantId,
        name_ar: restaurantLanguage === "ar" ? trimmedCategory : null,
        name_fr: restaurantLanguage === "fr" ? trimmedCategory : null,
        name_en: restaurantLanguage === "en" ? trimmedCategory : null,
        sort_order: 1,
      });

      if (error) {
        setFormError(translateDataError(error.message, t));
        setFinishing(false);
        return;
      }
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-lg">
      <ol className="mb-8 flex items-center gap-3" aria-label={t.onboarding.title}>
        {[1, 2].map((value) => (
          <li key={value} className="flex flex-1 items-center gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                step >= value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
              aria-current={step === value ? "step" : undefined}
            >
              {step > value ? <Check className="size-4" /> : value}
            </span>
            <span className={`text-sm ${step >= value ? "font-medium" : "text-muted-foreground"}`}>
              {value === 1 ? t.onboarding.stepRestaurant : t.onboarding.stepMenu}
            </span>
            {value === 1 ? <span className="h-px flex-1 bg-border" aria-hidden /> : null}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
        {formError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertText className="text-foreground">{formError}</AlertText>
          </Alert>
        ) : null}

        {step === 1 ? (
          <form onSubmit={createRestaurant} className="space-y-4" noValidate>
            <Field label={t.onboarding.restaurantName} htmlFor="name" error={errors.name?.message} required>
              <Input
                id="name"
                placeholder={t.onboarding.restaurantNamePlaceholder}
                aria-invalid={Boolean(errors.name)}
                {...register("name", {
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    if (!slugEdited) setValue("slug", slugify(event.target.value), { shouldValidate: false });
                  },
                })}
              />
            </Field>

            <Field label={t.onboarding.restaurantType} htmlFor="restaurant_type">
              <Select
                defaultValue="cafe"
                onValueChange={(value) => setValue("restaurant_type", value)}
              >
                <SelectTrigger id="restaurant_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESTAURANT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label={t.onboarding.slug}
              htmlFor="slug"
              error={errors.slug?.message}
              hint={`${SITE_URL}/menu/${slug || "…"}`}
              required
            >
              <Input
                id="slug"
                dir="ltr"
                className="font-mono text-sm"
                aria-invalid={Boolean(errors.slug)}
                {...register("slug", { onChange: () => setSlugEdited(true) })}
              />
            </Field>

            <Field label={t.onboarding.defaultLanguage} htmlFor="default_language">
              <Select
                defaultValue="ar"
                onValueChange={(value) => setValue("default_language", value as Locale)}
              >
                <SelectTrigger id="default_language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      {localeLabel[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {t.onboarding.createRestaurant}
              <ArrowRight className="rtl-flip" aria-hidden />
            </Button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg bg-success/[0.07] p-3 text-sm">
              <PartyPopper className="size-5 shrink-0 text-success" aria-hidden />
              <span>{t.onboarding.successTitle}</span>
            </div>

            {restaurantId ? (
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                restaurantId={restaurantId}
                kind="logo"
                label={t.onboarding.logo}
              />
            ) : null}

            <Field label={t.onboarding.firstCategory} htmlFor="firstCategory" hint={t.onboarding.firstCategoryHelp}>
              <Input
                id="firstCategory"
                placeholder={t.onboarding.firstCategoryPlaceholder}
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
              />
            </Field>

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button size="lg" className="flex-1" loading={finishing} onClick={() => void finish()}>
                {t.common.finish}
                <ArrowLeft className="rtl-flip rotate-180" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  router.replace("/dashboard");
                  router.refresh();
                }}
                disabled={finishing}
              >
                {t.onboarding.skipForNow}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
