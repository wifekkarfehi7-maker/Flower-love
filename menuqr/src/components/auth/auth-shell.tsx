"use client";

import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Alert, AlertText, AlertTitle } from "@/components/ui/misc";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useTranslation } from "@/lib/i18n/provider";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="rounded-md focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>
        <LanguageSwitcher variant="outline" />
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>

          {isSupabaseConfigured() ? null : (
            <Alert variant="warning" className="mb-4">
              <div>
                <AlertTitle>{t.auth.notConfiguredTitle}</AlertTitle>
                <AlertText className="mt-1">{t.auth.notConfiguredText}</AlertText>
              </div>
            </Alert>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">{children}</div>

          {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
