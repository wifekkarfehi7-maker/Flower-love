"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "#templates", label: t.nav.templates },
    { href: "#how-it-works", label: t.nav.howItWorks },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#faq", label: t.nav.faq },
    { href: "#contact", label: t.nav.contact },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "border-b border-ink-100 bg-background/90 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-gradient shadow-soft">
            <Heart className="h-5 w-5 text-ink-950" fill="currentColor" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight text-ink-900">
            Flower <span className="text-gold-600">&amp;</span> Love
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-gold-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t.nav.login}</Link>
          </Button>
          <Button asChild variant="gold" size="sm">
            <Link href="/register">{t.nav.createInvitation}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 text-ink-700"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-ink-100 bg-background lg:hidden animate-fade-in">
          <Container className="flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-ink-700 hover:bg-ink-50"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-4">
              <Button asChild variant="outline">
                <Link href="/login">{t.nav.login}</Link>
              </Button>
              <Button asChild variant="gold">
                <Link href="/register">{t.nav.createInvitation}</Link>
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
