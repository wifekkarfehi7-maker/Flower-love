"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field, Separator } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { localeDirection, localeLabel, locales } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/provider";
import { notifyMenuChanged } from "@/lib/menu/revalidate";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function MenuSettingsForm() {
  const { t } = useTranslation();
  const { restaurant, settings, setSettings, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("settings:write");

  const [values, setValues] = React.useState({
    show_unavailable_products: settings?.show_unavailable_products ?? true,
    show_prices: settings?.show_prices ?? true,
    enable_search: settings?.enable_search ?? true,
    show_product_images: settings?.show_product_images ?? true,
    enable_cart: settings?.enable_cart ?? false,
    enable_ordering: settings?.enable_ordering ?? false,
    allow_search_indexing: settings?.allow_search_indexing ?? true,
    announcement_ar: settings?.announcement_ar ?? "",
    announcement_fr: settings?.announcement_fr ?? "",
    announcement_en: settings?.announcement_en ?? "",
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggles = [
    { key: "show_unavailable_products", label: t.settings.showUnavailable, help: t.settings.showUnavailableHelp },
    { key: "show_prices", label: t.settings.showPrices },
    { key: "show_product_images", label: t.settings.showImages },
    { key: "enable_search", label: t.settings.enableSearch },
    { key: "enable_cart", label: t.menu.cart, help: t.menu.cartNote },
    { key: "enable_ordering", label: t.settings.enableOrdering, help: t.settings.enableOrderingHelp },
    { key: "allow_search_indexing", label: t.settings.allowIndexing, help: t.settings.allowIndexingHelp },
  ] as const;

  const save = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("restaurant_settings")
      .update({
        show_unavailable_products: values.show_unavailable_products,
        show_prices: values.show_prices,
        enable_search: values.enable_search,
        show_product_images: values.show_product_images,
        enable_cart: values.enable_cart,
        // Ordering without the basket would collect orders from a list no
        // guest was shown, so it is stored off when the basket goes off.
        enable_ordering: values.enable_cart && values.enable_ordering,
        allow_search_indexing: values.allow_search_indexing,
        announcement_ar: values.announcement_ar.trim() || null,
        announcement_fr: values.announcement_fr.trim() || null,
        announcement_en: values.announcement_en.trim() || null,
      })
      .eq("restaurant_id", restaurant.id)
      .select("*")
      .single();
    setSaving(false);

    if (updateError || !data) {
      setError(translateDataError(updateError?.message, t));
      return;
    }

    setSettings(data);
    notifyMenuChanged(restaurant.slug);
    toast({ title: t.restaurant.saved, variant: "success" });
  };

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{error}</AlertText>
        </Alert>
      ) : null}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {toggles.map((toggle) => (
          <li key={toggle.key}>
            <label className="flex items-center justify-between gap-4 p-3">
              <span>
                <span className="block text-sm font-medium">{toggle.label}</span>
                {"help" in toggle && toggle.help ? (
                  <span className="block text-xs text-muted-foreground">{toggle.help}</span>
                ) : null}
              </span>
              <Switch
                checked={values[toggle.key]}
                disabled={!canWrite}
                onCheckedChange={(checked) => setValues((current) => ({ ...current, [toggle.key]: checked }))}
              />
            </label>
          </li>
        ))}
      </ul>

      <Separator />

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">{t.settings.announcement}</h3>
          <p className="text-xs text-muted-foreground">{t.settings.announcementHelp}</p>
        </div>

        {locales.map((locale) => (
          <Field key={locale} label={localeLabel[locale]} htmlFor={`announcement_${locale}`}>
            <Input
              id={`announcement_${locale}`}
              dir={localeDirection[locale]}
              disabled={!canWrite}
              value={values[`announcement_${locale}`]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [`announcement_${locale}`]: event.target.value }))
              }
            />
          </Field>
        ))}
      </div>

      {canWrite ? (
        <Button loading={saving} onClick={() => void save()}>
          {t.common.save}
        </Button>
      ) : null}
    </div>
  );
}
