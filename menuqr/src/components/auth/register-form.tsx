"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText, AlertTitle, Field } from "@/components/ui/misc";
import { translateAuthError } from "@/lib/auth/error-map";
import { authSchemas, type RegisterValues } from "@/lib/auth/schemas";
import { SITE_URL } from "@/lib/config";
import { useTranslation } from "@/lib/i18n/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = React.useState(false);

  const schema = React.useMemo(() => authSchemas(t).register, [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${SITE_URL}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setFormError(translateAuthError(error.message, t));
      return;
    }

    // With email confirmation enabled Supabase returns a user but no session.
    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
      return;
    }

    setAwaitingConfirmation(true);
  });

  if (awaitingConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t.auth.checkEmail}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.auth.confirmEmailText}</p>
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

      <Field label={t.auth.fullName} htmlFor="fullName" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder={t.auth.fullNamePlaceholder}
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
      </Field>

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
        {t.auth.register}
      </Button>
    </form>
  );
}
