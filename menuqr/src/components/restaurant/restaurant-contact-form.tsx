"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field, Separator } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useTranslation } from "@/lib/i18n/provider";
import { parseSocialLinks } from "@/lib/menu/opening-hours";
import { notifyMenuChanged } from "@/lib/menu/revalidate";
import { restaurantSchemas, type RestaurantContactValues } from "@/lib/restaurants/schemas";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function RestaurantContactForm() {
  const { t } = useTranslation();
  const { restaurant, settings, setRestaurant, setSettings, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("restaurant:write");
  const [formError, setFormError] = React.useState<string | null>(null);

  const social = React.useMemo(() => parseSocialLinks(settings?.social_links), [settings?.social_links]);

  const schema = React.useMemo(() => restaurantSchemas(t).contact, [t]);
  const form = useForm<RestaurantContactValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: restaurant.phone ?? "",
      email: restaurant.email ?? "",
      address: restaurant.address ?? "",
      google_maps_url: restaurant.google_maps_url ?? "",
      facebook: social.facebook ?? "",
      instagram: social.instagram ?? "",
      tiktok: social.tiktok ?? "",
      website: social.website ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const socialLinks = {
      facebook: values.facebook || null,
      instagram: values.instagram || null,
      tiktok: values.tiktok || null,
      website: values.website || null,
    };

    const [restaurantResult, settingsResult] = await Promise.all([
      supabase
        .from("restaurants")
        .update({
          phone: values.phone || null,
          email: values.email || null,
          address: values.address || null,
          google_maps_url: values.google_maps_url || null,
        })
        .eq("id", restaurant.id)
        .select("*")
        .single(),
      supabase
        .from("restaurant_settings")
        .update({ social_links: socialLinks })
        .eq("restaurant_id", restaurant.id)
        .select("*")
        .single(),
    ]);

    if (restaurantResult.error || !restaurantResult.data) {
      setFormError(translateDataError(restaurantResult.error?.message, t));
      return;
    }

    setRestaurant(restaurantResult.data);
    if (settingsResult.data) setSettings(settingsResult.data);
    notifyMenuChanged(restaurant.slug);
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
        <Field label={t.restaurant.phone} htmlFor="phone" error={form.formState.errors.phone?.message}>
          <Input id="phone" dir="ltr" disabled={!canWrite} placeholder="+216 71 000 000" {...form.register("phone")} />
        </Field>

        <Field label={t.restaurant.email} htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" dir="ltr" disabled={!canWrite} {...form.register("email")} />
        </Field>
      </div>

      <Field label={t.restaurant.address} htmlFor="address" error={form.formState.errors.address?.message}>
        <Input id="address" disabled={!canWrite} {...form.register("address")} />
      </Field>

      <Field
        label={t.restaurant.mapsUrl}
        htmlFor="google_maps_url"
        error={form.formState.errors.google_maps_url?.message}
      >
        <Input id="google_maps_url" dir="ltr" disabled={!canWrite} {...form.register("google_maps_url")} />
      </Field>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold">{t.restaurant.social}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label={t.restaurant.facebook} htmlFor="facebook" error={form.formState.errors.facebook?.message}>
            <Input id="facebook" dir="ltr" disabled={!canWrite} {...form.register("facebook")} />
          </Field>
          <Field label={t.restaurant.instagram} htmlFor="instagram" error={form.formState.errors.instagram?.message}>
            <Input id="instagram" dir="ltr" disabled={!canWrite} {...form.register("instagram")} />
          </Field>
          <Field label={t.restaurant.tiktok} htmlFor="tiktok" error={form.formState.errors.tiktok?.message}>
            <Input id="tiktok" dir="ltr" disabled={!canWrite} {...form.register("tiktok")} />
          </Field>
          <Field label={t.restaurant.website} htmlFor="website" error={form.formState.errors.website?.message}>
            <Input id="website" dir="ltr" disabled={!canWrite} {...form.register("website")} />
          </Field>
        </div>
      </div>

      {canWrite ? (
        <Button type="submit" loading={form.formState.isSubmitting}>
          {t.common.save}
        </Button>
      ) : null}
    </form>
  );
}
