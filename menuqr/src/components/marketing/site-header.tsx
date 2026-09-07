"use client";

import { Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/provider";
import { useTranslation } from "@/lib/i18n/provider";

const SECTIONS = [
  { href: "#how-it-works", label: (t: ReturnType<typeof useTranslation>["t"]) => t.nav.howItWorks },
  { href: "#features", label: (t: ReturnType<typeof useTranslation>["t"]) => t.nav.features },
  { href: "#pricing", label: (t: ReturnType<typeof useTranslation>["t"]) => t.nav.pricing },
  { href: "#faq", label: (t: ReturnType<typeof useTranslation>["t"]) => t.nav.faq },
];

export function SiteHeader() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="rounded-md focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label={t.nav.features}>
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {section.label(t)}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <LanguageSwitcher />

          {user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">{t.nav.dashboard}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t.nav.login}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t.nav.register}</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={t.nav.features}
            aria-expanded={open}
          >
            {open ? <X /> : <MenuIcon />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background px-4 py-2 md:hidden" aria-label={t.nav.features}>
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground"
            >
              {section.label(t)}
            </a>
          ))}
          <Link href="/login" className="block rounded-md px-3 py-2.5 text-sm font-medium sm:hidden">
            {t.nav.login}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
