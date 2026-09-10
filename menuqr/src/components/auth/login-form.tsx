"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { translateAuthError } from "@/lib/auth/error-map";
import { authSchemas, type LoginValues } from "@/lib/auth/schemas";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/navigation";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = React.useState<string | null>(null);

  const schema = React.useMemo(() => authSchemas(t).login, [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(translateAuthError(error.message, t));
      return;
    }

    // A suspended account keeps its credentials but loses access.
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_suspended")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.is_suspended) {
        await supabase.auth.signOut();
        setFormError(t.auth.accountSuspended);
        return;
      }
    }

    router.replace(safeInternalPath(searchParams.get("next"), "/dashboard"));
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{formError}</AlertText>
        </Alert>
      ) : null}

      <Field label={t.auth.email} htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          placeholder={t.auth.emailPlaceholder}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </Field>

      <Field label={t.auth.password} htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
      </Field>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          {t.auth.forgotPassword}
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        {t.auth.login}
      </Button>
    </form>
  );
}
