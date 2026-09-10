"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useTranslation } from "@/lib/i18n/provider";
import { notifyMenuChanged } from "@/lib/menu/revalidate";
import { menuThemeStyle } from "@/lib/menu/theme";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { MenuTheme } from "@/types/database";

const THEMES: MenuTheme[] = ["classic", "modern", "elegant", "minimal", "dark", "coffee", "restaurant"];
const HEX = /^#[0-9a-fA-F]{6}$/;

function ColorField({
  label,
  value,
  onChange,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX.test(value) ? value : "#0f766e"}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label={label}
          className="size-10 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1"
        />
        <Input
          value={value}
          dir="ltr"
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="font-mono text-sm uppercase"
        />
      </div>
    </Field>
  );
}

export function RestaurantBrandingForm() {
  const { t } = useTranslation();
  const { restaurant, setRestaurant, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("restaurant:write");

  const [logoUrl, setLogoUrl] = React.useState(restaurant.logo_url);
  const [coverUrl, setCoverUrl] = React.useState(restaurant.cover_url);
  const [primary, setPrimary] = React.useState(restaurant.primary_color);
  const [secondary, setSecondary] = React.useState(restaurant.secondary_color);
  const [theme, setTheme] = React.useState<MenuTheme>(restaurant.theme);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const themeLabels: Record<MenuTheme, string> = {
    classic: t.restaurant.themeClassic,
    modern: t.restaurant.themeModern,
    elegant: t.restaurant.themeElegant,
    minimal: t.restaurant.themeMinimal,
    dark: t.restaurant.themeDark,
    coffee: t.restaurant.themeCoffee,
    restaurant: t.restaurant.themeRestaurant,
  };

  const save = async () => {
    if (!HEX.test(primary) || !HEX.test(secondary)) {
      setError(t.validation.invalidColor);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("restaurants")
      .update({
        logo_url: logoUrl,
        cover_url: coverUrl,
        primary_color: primary,
        secondary_color: secondary,
        theme,
      })
      .eq("id", restaurant.id)
      .select("*")
      .single();
    setSaving(false);

    if (updateError || !data) {
      setError(translateDataError(updateError?.message, t));
      return;
    }

    setRestaurant(data);
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

      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <ImageUpload
          value={logoUrl}
          onChange={setLogoUrl}
          restaurantId={restaurant.id}
          kind="logo"
          label={t.restaurant.logo}
          disabled={!canWrite}
        />
        <ImageUpload
          value={coverUrl}
          onChange={setCoverUrl}
          restaurantId={restaurant.id}
          kind="cover"
          label={t.restaurant.cover}
          aspect="wide"
          disabled={!canWrite}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField label={t.restaurant.primaryColor} value={primary} onChange={setPrimary} disabled={!canWrite} />
        <ColorField label={t.restaurant.secondaryColor} value={secondary} onChange={setSecondary} disabled={!canWrite} />
      </div>

      <Field label={t.restaurant.theme}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((option) => {
            const style = menuThemeStyle(option, HEX.test(primary) ? primary : "#0f766e", secondary);
            const selected = option === theme;
            return (
              <button
                key={option}
                type="button"
                disabled={!canWrite}
                onClick={() => setTheme(option)}
                aria-pressed={selected}
                className={cn(
                  "overflow-hidden rounded-lg border-2 text-start transition-colors",
                  selected ? "border-primary" : "border-border"
                )}
              >
                <span style={style} className="block bg-[var(--menu-bg)] p-3">
                  <span className="block h-2 w-10 rounded-full bg-[var(--menu-accent)]" />
                  <span className="mt-2 block rounded-[var(--menu-radius)] border border-[var(--menu-border)] bg-[var(--menu-surface)] p-2">
                    <span className="block h-1.5 w-12 rounded-full bg-[var(--menu-text)] opacity-80" />
                    <span className="mt-1.5 block h-1.5 w-8 rounded-full bg-[var(--menu-muted)] opacity-60" />
                  </span>
                </span>
                <span className="flex items-center justify-between gap-1 px-2.5 py-2 text-xs font-medium">
                  {themeLabels[option]}
                  {selected ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      {canWrite ? (
        <Button loading={saving} onClick={() => void save()}>
          {t.common.save}
        </Button>
      ) : null}
    </div>
  );
}
