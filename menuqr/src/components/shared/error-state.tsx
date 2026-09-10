"use client";

import { FileQuestion, Lock, RefreshCw, ServerCrash, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/provider";

type ErrorVariant = "notFound" | "server" | "unauthorized" | "forbidden";

const ICONS = {
  notFound: FileQuestion,
  server: ServerCrash,
  unauthorized: Lock,
  forbidden: ShieldAlert,
} as const;

/**
 * The only thing a visitor ever sees for a failure. Internal messages and
 * stack traces stay in the server logs.
 */
export function ErrorState({ variant, onRetry }: { variant: ErrorVariant; onRetry?: () => void }) {
  const { t } = useTranslation();
  const Icon = ICONS[variant];

  const copy = {
    notFound: { title: t.errors.notFoundTitle, text: t.errors.notFoundText },
    server: { title: t.errors.serverErrorTitle, text: t.errors.serverErrorText },
    unauthorized: { title: t.errors.unauthorizedTitle, text: t.errors.unauthorizedText },
    forbidden: { title: t.errors.forbiddenTitle, text: t.errors.forbiddenText },
  }[variant];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <Link href="/" className="mb-8 rounded-md focus-visible:ring-2 focus-visible:ring-ring">
        <Logo />
      </Link>

      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-8" aria-hidden />
      </span>

      <h1 className="mt-5 text-xl font-semibold">{copy.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{copy.text}</p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button onClick={onRetry}>
            <RefreshCw aria-hidden />
            {t.common.retry}
          </Button>
        ) : null}

        <Button variant={onRetry ? "outline" : "default"} asChild>
          <Link href="/">{t.errors.goHome}</Link>
        </Button>

        {variant === "unauthorized" ? (
          <Button variant="outline" asChild>
            <Link href="/login">{t.nav.login}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
