"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { FieldError } from "@/components/auth/field-error";
import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, fieldErrorsFromZod } from "@/lib/auth/schemas";
import { SITE_URL } from "@/lib/config";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n/types";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<Partial<Record<string, keyof Dictionary["auth"]>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  if (!supabase) {
    return (
      <AuthCard title={t.auth.forgotPasswordTitle}>
        <NotConfiguredNotice />
      </AuthCard>
    );
  }

  if (sent) {
    return (
      <AuthCard title={t.auth.forgotPasswordTitle}>
        <div className="text-center">
          <MailCheck className="mx-auto h-10 w-10 text-gold-500" />
          <p className="mt-4 font-heading text-lg font-semibold text-ink-900">
            {t.auth.forgotPasswordSuccessTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.auth.forgotPasswordSuccessDescription}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/login">{t.auth.goToLogin}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    await supabase!.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    });
    setSubmitting(false);
    // Always show the same success state, whether or not the email exists —
    // avoids leaking which emails are registered.
    setSent(true);
  }

  return (
    <AuthCard title={t.auth.forgotPasswordTitle} subtitle={t.auth.forgotPasswordDescription}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <Label htmlFor="email">{t.auth.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            className="text-start"
            placeholder={t.auth.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!errors.email}
          />
          <FieldError>{errors.email && t.auth[errors.email]}</FieldError>
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t.auth.forgotPasswordCtaLoading : t.auth.forgotPasswordCta}
        </Button>

        <p className="text-center text-sm text-ink-500">
          <Link href="/login" className="font-semibold text-gold-700 underline-offset-2 hover:underline">
            {t.auth.goToLogin}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
