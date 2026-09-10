"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { translateAuthError } from "@/lib/auth/error-map";
import { authSchemas, type ResetPasswordValues } from "@/lib/auth/schemas";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const schema = React.useMemo(() => authSchemas(t).resetPassword, [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setFormError(translateAuthError(error.message, t));
      return;
    }

    setDone(true);
    router.refresh();
  });

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{t.auth.passwordUpdated}</p>
        <Button asChild className="w-full" size="lg">
          <Link href="/dashboard">{t.nav.dashboard}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{formError}</AlertText>
        </Alert>
      ) : null}

      <Field label={t.settings.newPassword} htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={t.auth.passwordPlaceholder}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
      </Field>

      <Field label={t.auth.confirmPassword} htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
      </Field>

      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        {t.auth.updatePassword}
      </Button>
    </form>
  );
}
