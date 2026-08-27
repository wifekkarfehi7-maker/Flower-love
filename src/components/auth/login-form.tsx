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
import { SITE_URL } from "@/lib/config";
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
  const [googleSubmitting, setGoogleSubmitting] = React.useState(false);

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

  async function handleGoogle() {
    setGoogleSubmitting(true);
    setFormError(null);
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    if (error) {
      setFormError(t.auth[mapAuthErrorToKey(error.message)]);
      setGoogleSubmitting(false);
    }
  }

  return (
    <AuthCard title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
    <div className="space-y-5">
      {formError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={googleSubmitting}
      >
        {googleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {t.auth.continueWithGoogle}
      </Button>

      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" />
        {t.auth.orDivider}
        <span className="h-px flex-1 bg-ink-100" />
      </div>

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.43 3.58v2.98h3.93c2.3-2.12 3.62-5.24 3.62-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.93-2.98c-1.09.73-2.48 1.16-4 1.16-3.08 0-5.68-2.08-6.61-4.87H1.34v3.07C3.31 21.3 7.35 24 12 24z"
      />
      <path fill="#FBBC05" d="M5.39 14.39a7.2 7.2 0 0 1 0-4.78V6.54H1.34a12 12 0 0 0 0 10.92l4.05-3.07z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.35 0 3.31 2.7 1.34 6.54l4.05 3.07C6.32 6.82 8.92 4.75 12 4.75z"
      />
    </svg>
  );
}
