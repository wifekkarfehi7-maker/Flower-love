"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { FieldError } from "@/components/auth/field-error";
import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resetPasswordSchema, fieldErrorsFromZod } from "@/lib/auth/schemas";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n/types";

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Partial<Record<string, keyof Dictionary["auth"]>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (!supabase) {
    return (
      <AuthCard title={t.auth.resetPasswordTitle}>
        <NotConfiguredNotice />
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title={t.auth.resetPasswordTitle}>
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-gold-500" />
          <p className="mt-4 font-heading text-lg font-semibold text-ink-900">
            {t.auth.resetPasswordSuccessTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.auth.resetPasswordSuccessDescription}</p>
          <Button className="mt-6" onClick={() => router.push("/my-invitations")}>
            {t.auth.myInvitations}
          </Button>
        </div>
      </AuthCard>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase!.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);

    if (error) {
      setFormError(t.auth.errorGeneric);
      return;
    }
    setDone(true);
  }

  return (
    <AuthCard title={t.auth.resetPasswordTitle} subtitle={t.auth.resetPasswordDescription}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p>
        )}

        <div>
          <Label htmlFor="password">{t.auth.newPasswordLabel}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            className="text-start"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!errors.password}
          />
          <FieldError>{errors.password && t.auth[errors.password]}</FieldError>
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t.auth.confirmPasswordLabel}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            className="text-start"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            invalid={!!errors.confirmPassword}
          />
          <FieldError>{errors.confirmPassword && t.auth[errors.confirmPassword]}</FieldError>
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t.auth.resetPasswordCtaLoading : t.auth.resetPasswordCta}
        </Button>
      </form>
    </AuthCard>
  );
}
