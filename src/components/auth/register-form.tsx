"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AuthCard } from "@/components/auth/auth-card";
import { FieldError } from "@/components/auth/field-error";
import { WhatsappInput } from "@/components/auth/whatsapp-input";
import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerSchema, fieldErrorsFromZod } from "@/lib/auth/schemas";
import { mapAuthErrorToKey } from "@/lib/auth/error-map";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { SITE_URL } from "@/lib/config";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n/types";

type Errors = Partial<Record<string, keyof Dictionary["auth"]>>;

export function RegisterForm() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [whatsappDialCode, setWhatsappDialCode] = React.useState(DEFAULT_COUNTRY.dialCode);
  const [whatsappLocal, setWhatsappLocal] = React.useState("");
  const [country, setCountry] = React.useState(DEFAULT_COUNTRY.code);
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [checkEmail, setCheckEmail] = React.useState(false);

  if (!supabase) {
    return (
      <AuthCard title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
        <NotConfiguredNotice />
      </AuthCard>
    );
  }

  if (checkEmail) {
    return (
      <AuthCard title={t.auth.registerTitle}>
        <div className="text-center">
          <MailCheck className="mx-auto h-10 w-10 text-gold-500" />
          <p className="mt-4 font-heading text-lg font-semibold text-ink-900">{t.auth.registerSuccessTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.auth.registerSuccessDescription}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/login">{t.auth.loginLink}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
      whatsappDialCode,
      whatsappLocal,
      country,
      preferredLanguage: locale,
      agreeTerms,
    });

    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { data, error } = await supabase!.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          whatsapp: `${parsed.data.whatsappDialCode}${parsed.data.whatsappLocal}`,
          country: parsed.data.country,
          preferred_language: parsed.data.preferredLanguage,
        },
        emailRedirectTo: `${SITE_URL}/auth/callback?next=/my-invitations`,
      },
    });

    setSubmitting(false);

    if (error) {
      setFormError(t.auth[mapAuthErrorToKey(error.message)]);
      return;
    }

    if (data.session) {
      router.push("/my-invitations");
      router.refresh();
      return;
    }

    setCheckEmail(true);
  }

  return (
    <AuthCard title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</p>
      )}

      <div>
        <Label htmlFor="fullName">{t.auth.fullNameLabel}</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder={t.auth.fullNamePlaceholder}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          invalid={!!errors.fullName}
        />
        <FieldError>{errors.fullName && t.auth[errors.fullName]}</FieldError>
      </div>

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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="password">{t.auth.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            className="text-start"
            placeholder={t.auth.passwordPlaceholder}
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
            placeholder={t.auth.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            invalid={!!errors.confirmPassword}
          />
          <FieldError>{errors.confirmPassword && t.auth[errors.confirmPassword]}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="whatsapp">{t.auth.whatsappLabel}</Label>
        <WhatsappInput
          id="whatsapp"
          dialCode={whatsappDialCode}
          local={whatsappLocal}
          onDialCodeChange={setWhatsappDialCode}
          onLocalChange={setWhatsappLocal}
          placeholder={t.auth.whatsappPlaceholder}
          invalid={!!errors.whatsappLocal}
        />
        <FieldError>{errors.whatsappLocal && t.auth[errors.whatsappLocal]}</FieldError>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{t.auth.whatsappHelper}</p>
      </div>

      <div>
        <Label htmlFor="country">{t.auth.countryLabel}</Label>
        <Select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name[locale]}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-600">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span>
          {t.auth.agreeTermsPrefix}{" "}
          <Link href="/privacy" className="font-medium text-gold-700 underline-offset-2 hover:underline">
            {t.auth.agreeTermsPrivacy}
          </Link>{" "}
          {t.auth.agreeTermsAnd}{" "}
          <Link href="/terms" className="font-medium text-gold-700 underline-offset-2 hover:underline">
            {t.auth.agreeTermsTerms}
          </Link>
        </span>
      </label>
      <FieldError>{errors.agreeTerms && t.auth[errors.agreeTerms]}</FieldError>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? t.auth.registerCtaLoading : t.auth.registerCta}
      </Button>

      <p className="text-center text-sm text-ink-500">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-gold-700 underline-offset-2 hover:underline">
          {t.auth.loginLink}
        </Link>
      </p>
    </form>
    </AuthCard>
  );
}
