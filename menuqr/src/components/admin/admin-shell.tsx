"use client";

import { ArrowLeft, CreditCard, LayoutDashboard, LogOut, Settings, Store, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/provider";
import { useTranslation } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: (t: Dictionary) => t.admin.overview, icon: LayoutDashboard, exact: true },
  { href: "/admin/restaurants", label: (t: Dictionary) => t.admin.restaurants, icon: Store },
  { href: "/admin/users", label: (t: Dictionary) => t.admin.users, icon: Users },
  { href: "/admin/subscriptions", label: (t: Dictionary) => t.admin.subscriptions, icon: CreditCard },
  { href: "/admin/settings", label: (t: Dictionary) => t.admin.settings, icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring">
            <Logo />
          </Link>
          <Badge variant="warning">{t.admin.title}</Badge>

          <div className="ms-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="rtl-flip" aria-hidden />
                <span className="hidden sm:inline">{t.admin.backToDashboard}</span>
              </Link>
            </Button>
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label={t.nav.logout}>
              <LogOut className="rtl-flip" />
            </Button>
          </div>
        </div>

        <nav className="scrollbar-none mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label(t)}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
