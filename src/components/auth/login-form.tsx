"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { FieldError } from "@/components/auth/field-error";
import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginSchema, fieldErrorsFromZod } from "@/lib/auth/schemas";
import { mapAuthErrorToKey } from "@/lib/auth/error-map";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n/types";

type Errors = Partial<Record<string, keyof Dictionary["auth"]>>;

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const nextPath = searchParams.get("next") || "/my-invitations";

  if (!supabase) {
    return (
      <AuthCard title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
        <NotConfiguredNotice />
      </AuthCard>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await supabase!.auth.signInWithPassword(parsed.data);

    setSubmitting(false);

    if (error) {
      setFormError(t.auth[mapAuthErrorToKey(error.message)]);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <AuthCard title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
    <div className="space-y-5">
      {formError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p>
      )}

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

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t.auth.passwordLabel}</Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs font-medium text-gold-700 hover:underline">
              {t.auth.forgotPasswordLink}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            className="text-start"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!errors.password}
          />
          <FieldError>{errors.password && t.auth[errors.password]}</FieldError>
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t.auth.loginCtaLoading : t.auth.loginCta}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-500">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-semibold text-gold-700 underline-offset-2 hover:underline">
          {t.auth.registerLink}
        </Link>
      </p>
    </div>
    </AuthCard>
  );
}
