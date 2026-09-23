"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Wordmark } from "@/components/brand/wordmark";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useAuth } from "@/lib/auth/provider";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: { admin: "لوحة الإدارة", menu: "القائمة", close: "إغلاق", nav: "التنقل الرئيسي", account: "حسابي" },
  fr: { admin: "Administration", menu: "Menu", close: "Fermer", nav: "Navigation principale", account: "Mon compte" },
  en: { admin: "Admin", menu: "Menu", close: "Close", nav: "Main navigation", account: "My account" },
};

/**
 * A paper band with a hairline: solid, so dark sections scrolling beneath
 * never bleed through it. The full row appears from 1280px — the first width
 * at which the French labels ("Comment ça marche", "Créer une invitation")
 * sit beside the wordmark without touching it; below that, a menu.
 */
export function SiteHeader() {
  const { t, locale } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const s = STRINGS[locale];
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu whenever the route changes.
  React.useEffect(() => setOpen(false), [pathname]);

  const navItems = [
    { href: "/templates", label: t.nav.templates },
    { href: "/#how-it-works", label: t.nav.howItWorks },
    { href: "/#pricing", label: t.nav.pricing },
    { href: "/#faq", label: t.nav.faq },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-background transition-colors duration-300",
        scrolled || open ? "border-ink-900/10" : "border-transparent"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-8 xl:h-[4.5rem]">
        <Link href="/" aria-label="Flower & Love" className="shrink-0 outline-offset-8 focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-900">
          <Wordmark />
        </Link>

        <nav aria-label={s.nav} className="hidden xl:block">
          <ul className="flex items-center gap-9">
            {navItems.map((item) => {
              const active = item.href === pathname;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "ui-label relative whitespace-nowrap py-2 text-[0.8125rem] transition-colors",
                      active ? "text-ink-900" : "text-ink-500 hover:text-ink-900"
                    )}
                  >
                    {item.label}
                    {active && <span aria-hidden="true" className="absolute inset-x-0 -bottom-0.5 h-px bg-gold-500" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-6 xl:flex">
          <LanguageSwitcher />
          <span aria-hidden="true" className="h-4 w-px bg-ink-900/10" />
          {user ? (
            <AccountMenu name={profile?.full_name} isAdmin={profile?.role === "admin"} onSignOut={signOut} />
          ) : (
            <>
              <Link
                href="/login"
                className="ui-label whitespace-nowrap text-[0.8125rem] text-ink-500 transition-colors hover:text-ink-900"
              >
                {t.nav.login}
              </Link>
              <Button asChild size="sm">
                <Link href="/register">{t.nav.createInvitation}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-menu"
          className="ui-label -me-2 flex h-10 items-center gap-3 px-2 text-[0.8125rem] text-ink-800 xl:hidden"
        >
          <span>{open ? s.close : s.menu}</span>
          <span aria-hidden="true" className="relative block h-2.5 w-5">
            <span
              className={cn(
                "absolute inset-x-0 h-px bg-current transition-transform duration-300",
                open ? "top-1/2 rotate-45" : "top-0"
              )}
            />
            <span
              className={cn(
                "absolute inset-x-0 h-px bg-current transition-transform duration-300",
                open ? "top-1/2 -rotate-45" : "bottom-0"
              )}
            />
          </span>
        </button>
      </Container>

      {open && (
        <MobileMenu
          navItems={navItems}
          pathname={pathname}
          onClose={() => {
            setOpen(false);
            toggleRef.current?.focus();
          }}
          labels={{ admin: s.admin, nav: s.nav }}
          user={user ? { name: profile?.full_name ?? null, isAdmin: profile?.role === "admin" } : null}
          onSignOut={signOut}
        />
      )}
    </header>
  );
}

/**
 * The phone menu is a page of its own: the destinations set large, in the
 * display face, with language and account below. Escape closes it, the page
 * behind stops scrolling, and focus starts on the first link.
 */
function MobileMenu({
  navItems,
  pathname,
  onClose,
  labels,
  user,
  onSignOut,
}: {
  navItems: { href: string; label: string }[];
  pathname: string;
  onClose: () => void;
  labels: { admin: string; nav: string };
  user: { name: string | null; isAdmin: boolean } | null;
  onSignOut: () => void;
}) {
  const { t } = useTranslation();
  const firstLinkRef = React.useRef<HTMLAnchorElement>(null);
  // Read through a ref so a parent re-render can't re-run the effect and steal focus back.
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div id="site-menu" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-background xl:hidden animate-fade-in">
      <Container className="flex min-h-full flex-col pb-10 pt-8">
        <nav aria-label={labels.nav}>
          <ul className="border-t border-ink-900/10">
            {navItems.map((item, i) => (
              <li key={item.href} className="border-b border-ink-900/10">
                <Link
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  onClick={onClose}
                  aria-current={item.href === pathname ? "page" : undefined}
                  className="type-h2 block py-5 transition-colors hover:text-ink-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-12">
          <div className="flex items-center justify-between border-b border-ink-900/10 pb-6">
            <span className="type-meta">{t.common.langSwitcherLabel}</span>
            <LanguageSwitcher />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {user ? (
              <>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/my-invitations" onClick={onClose}>
                    {t.auth.myInvitations}
                  </Link>
                </Button>
                {user.isAdmin && (
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/admin" onClick={onClose}>
                      {labels.admin}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="text"
                  className="mt-2 self-center text-ink-500"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                >
                  {t.auth.signOut}
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/register" onClick={onClose}>
                    {t.nav.createInvitation}
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/login" onClick={onClose}>
                    {t.nav.login}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
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
  const s = STRINGS[locale];
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const initial = name?.trim()?.[0]?.toUpperCase() ?? "·";
  const itemClass =
    "flex w-full items-center px-4 py-2.5 text-start text-[0.875rem] text-ink-700 transition-colors hover:bg-ink-900/[0.04] hover:text-ink-900";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={s.account}
        className="flex h-9 items-center gap-2.5 text-[0.8125rem] text-ink-700 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-900/15 text-[0.75rem] font-medium text-ink-800">
          {initial}
        </span>
        <span className="max-w-[9rem] truncate">{name || t.auth.myInvitations}</span>
        <ChevronDown aria-hidden="true" strokeWidth={1.5} className="h-3.5 w-3.5 text-ink-400" />
      </button>

      {open && (
        <div role="menu" className="absolute end-0 z-50 mt-3 w-56 overflow-hidden rounded-md bg-paper-raised py-2 shadow-float animate-fade-in">
          <Link href="/my-invitations" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            {t.auth.myInvitations}
          </Link>
          {isAdmin && (
            <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              {s.admin}
            </Link>
          )}
          <div aria-hidden="true" className="my-2 h-px bg-ink-900/10" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className={cn(itemClass, "text-ink-500")}
          >
            {t.auth.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
