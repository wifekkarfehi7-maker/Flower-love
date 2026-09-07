"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { translateAuthError } from "@/lib/auth/error-map";
import { authSchemas, type ForgotPasswordValues } from "@/lib/auth/schemas";
import { SITE_URL } from "@/lib/config";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  const schema = React.useMemo(() => authSchemas(t).forgotPassword, [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setFormError(translateAuthError(error.message, t));
      return;
    }

    setSent(true);
  });

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t.auth.checkEmail}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.auth.checkEmailText}</p>
        </div>
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

      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        {t.auth.sendResetLink}
      </Button>
    </form>
  );
}
