"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AuthCard } from "@/components/auth/auth-card";
import { FieldError } from "@/components/auth/field-error";
import { WhatsappInput } from "@/components/auth/whatsapp-input";
import { NotConfiguredNotice } from "@/components/auth/not-configured-notice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/provider";
import { completeProfileSchema, fieldErrorsFromZod } from "@/lib/auth/schemas";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Dictionary } from "@/lib/i18n/types";

type Errors = Partial<Record<string, keyof Dictionary["auth"]>>;

/** Splits a stored "21694409166" whatsapp string back into dial code + local number. */
function splitWhatsapp(whatsapp: string | null | undefined): { dialCode: string; local: string } {
  if (!whatsapp) return { dialCode: DEFAULT_COUNTRY.dialCode, local: "" };
  const sorted = [...COUNTRIES].filter((c) => c.dialCode).sort((a, b) => b.dialCode.length - a.dialCode.length);
  const match = sorted.find((c) => whatsapp.startsWith(c.dialCode));
  if (!match) return { dialCode: DEFAULT_COUNTRY.dialCode, local: whatsapp };
  return { dialCode: match.dialCode, local: whatsapp.slice(match.dialCode.length) };
}

export function CompleteProfileForm() {
  const { t, locale } = useTranslation();
  const { user, profile, isProfileComplete, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const initialWhatsapp = splitWhatsapp(profile?.whatsapp);
  const [fullName, setFullName] = React.useState(profile?.full_name ?? "");
  const [whatsappDialCode, setWhatsappDialCode] = React.useState(initialWhatsapp.dialCode);
  const [whatsappLocal, setWhatsappLocal] = React.useState(initialWhatsapp.local);
  const [country, setCountry] = React.useState(profile?.country ?? DEFAULT_COUNTRY.code);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isProfileComplete) {
      router.replace(searchParams.get("next") || "/my-invitations");
    }
  }, [isProfileComplete, router, searchParams]);

  if (!supabase) {
    return (
      <AuthCard title={t.auth.completeProfileTitle}>
        <NotConfiguredNotice />
      </AuthCard>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = completeProfileSchema.safeParse({ fullName, whatsappDialCode, whatsappLocal, country });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});

    if (!user) {
      setFormError(t.auth.errorGeneric);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase!
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        whatsapp: `${parsed.data.whatsappDialCode}${parsed.data.whatsappLocal}`,
        country: parsed.data.country,
      })
      .eq("id", user.id);
    setSubmitting(false);

    if (error) {
      setFormError(t.auth.errorGeneric);
      return;
    }

    await refreshProfile();
    router.push(searchParams.get("next") || "/my-invitations");
  }

  return (
    <AuthCard title={t.auth.completeProfileTitle} subtitle={t.auth.completeProfileDescription}>
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

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t.auth.completeProfileCtaLoading : t.auth.completeProfileCta}
        </Button>
      </form>
    </AuthCard>
  );
}
