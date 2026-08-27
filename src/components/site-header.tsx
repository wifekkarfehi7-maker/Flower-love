"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, LayoutGrid, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useAuth } from "@/lib/auth/provider";
import { cn } from "@/lib/utils";

const ADMIN_LABEL = { ar: "لوحة الإدارة", fr: "Administration", en: "Admin" };

export function SiteHeader() {
  const { t, locale } = useTranslation();
  const { user, profile, signOut } = useAuth();
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
          {user ? (
            <AccountMenu name={profile?.full_name} isAdmin={profile?.role === "admin"} onSignOut={signOut} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t.nav.login}</Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link href="/register">{t.nav.createInvitation}</Link>
              </Button>
            </>
          )}
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
              {user ? (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link href="/my-invitations">
                      <LayoutGrid className="h-4 w-4" />
                      {t.auth.myInvitations}
                    </Link>
                  </Button>
                  {profile?.role === "admin" && (
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link href="/admin">
                        <ShieldCheck className="h-4 w-4" />
                        {ADMIN_LABEL[locale]}
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => { setOpen(false); signOut(); }}>
                    <LogOut className="h-4 w-4" />
                    {t.auth.signOut}
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link href="/login">{t.nav.login}</Link>
                  </Button>
                  <Button asChild variant="gold" onClick={() => setOpen(false)}>
                    <Link href="/register">{t.nav.createInvitation}</Link>
                  </Button>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

function AccountMenu({
  name,
  isAdmin,
  onSignOut,
}: {
  name?: string | null;
  isAdmin?: boolean;
  onSignOut: () => void;
}) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initial = name?.trim()?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full border border-ink-200 ps-1.5 pe-3 text-sm font-medium text-ink-700 transition-colors hover:border-gold-300"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-gradient text-xs font-bold text-ink-950">
          {initial}
        </span>
        <span className="max-w-[8rem] truncate">{name || t.auth.myInvitations}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-card animate-scale-in"
        >
          <Link
            href="/my-invitations"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            <LayoutGrid className="h-4 w-4" />
            {t.auth.myInvitations}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {ADMIN_LABEL[locale]}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm text-destructive hover:bg-destructive/5"
          >
            <LogOut className="h-4 w-4" />
            {t.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
