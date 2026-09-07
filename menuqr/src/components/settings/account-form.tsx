"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field, Separator } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { translateAuthError, translateDataError } from "@/lib/auth/error-map";
import { useAuth } from "@/lib/auth/provider";
import { locales, localeLabel, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/provider";
import { restaurantSchemas, type AccountValues } from "@/lib/restaurants/schemas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountForm() {
  const { t, locale, setLocale } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();

  const [formError, setFormError] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = React.useState(false);

  const schema = React.useMemo(() => restaurantSchemas(t).account, [t]);
  const form = useForm<AccountValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !profile) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.full_name, phone: values.phone || null, preferred_language: locale })
      .eq("id", profile.id);

    if (error) {
      setFormError(translateDataError(error.message, t));
      return;
    }

    await refreshProfile();
    toast({ title: t.restaurant.saved, variant: "success" });
  });

  const changePassword = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    if (password.length < 8) {
      setPasswordError(t.validation.passwordMin);
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(translateAuthError(error.message, t));
      return;
    }

    setPassword("");
    toast({ title: t.auth.passwordUpdated, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertText className="text-foreground">{formError}</AlertText>
          </Alert>
        ) : null}

        <Field label={t.settings.accountEmail}>
          <Input value={profile?.email ?? ""} dir="ltr" disabled readOnly />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.settings.accountName} htmlFor="full_name" error={form.formState.errors.full_name?.message}>
            <Input id="full_name" {...form.register("full_name")} />
          </Field>

          <Field label={t.settings.accountPhone} htmlFor="account_phone" error={form.formState.errors.phone?.message}>
            <Input id="account_phone" dir="ltr" {...form.register("phone")} />
          </Field>
        </div>

        <Field label={t.settings.accountLanguage} htmlFor="dashboard_language">
          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger id="dashboard_language" className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((option) => (
                <SelectItem key={option} value={option}>
                  {localeLabel[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Button type="submit" loading={form.formState.isSubmitting}>
          {t.common.save}
        </Button>
      </form>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t.settings.changePassword}</h3>

        {passwordError ? (
          <Alert variant="destructive">
            <AlertText className="text-foreground">{passwordError}</AlertText>
          </Alert>
        ) : null}

        <Field label={t.settings.newPassword} htmlFor="new_password">
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            value={password}
            placeholder={t.auth.passwordPlaceholder}
            onChange={(event) => setPassword(event.target.value)}
            className="sm:w-80"
          />
        </Field>

        <Button variant="outline" loading={passwordSaving} onClick={() => void changePassword()} disabled={!password}>
          {t.settings.changePassword}
        </Button>
      </div>
    </div>
  );
}
