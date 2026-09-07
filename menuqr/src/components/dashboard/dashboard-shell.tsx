"use client";

import { ChevronDown, ExternalLink, LogOut, Menu as MenuIcon, Shield, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/provider";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV } from "./dashboard-nav";

function useVisibleNav() {
  const { can } = useRestaurant();
  return DASHBOARD_NAV.filter((item) => !item.capability || can(item.capability));
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = useVisibleNav();

  return (
    <nav className="flex flex-col gap-0.5" aria-label={t.dashboard.overview}>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            <span className="truncate">{item.label(t)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function RestaurantSwitcher({ compact = false }: { compact?: boolean }) {
  const { restaurant, memberships, switchRestaurant } = useRestaurant();
  const { t } = useTranslation();

  if (memberships.length < 2) {
    return (
      <div className={cn("min-w-0", compact && "hidden sm:block")}>
        <p className="truncate text-sm font-semibold">{restaurant.name}</p>
        <p className="truncate text-xs text-muted-foreground">/{restaurant.slug}</p>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{restaurant.name}</span>
            <span className="block truncate text-xs text-muted-foreground">/{restaurant.slug}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[14rem]">
        <DropdownMenuLabel>{t.dashboard.restaurant}</DropdownMenuLabel>
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.restaurant.id}
            onSelect={() => switchRestaurant(membership.restaurant.id)}
            className="justify-between"
          >
            <span className="truncate">{membership.restaurant.name}</span>
            {membership.restaurant.id === restaurant.id ? (
              <Badge variant="default" className="text-[10px]">
                {t.common.active}
              </Badge>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const { profile, isSuperAdmin, signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.nav.account}>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {(profile?.full_name ?? profile?.email ?? "?").slice(0, 1).toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        <DropdownMenuLabel className="truncate normal-case">{profile?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <UserRound aria-hidden />
            {t.nav.account}
          </Link>
        </DropdownMenuItem>
        {isSuperAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield aria-hidden />
              {t.nav.adminPanel}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => void signOut()}>
          <LogOut aria-hidden className="rtl-flip" />
          {t.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { restaurant } = useRestaurant();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-muted/40">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <Link href="/dashboard" className="rounded-md focus-visible:ring-2 focus-visible:ring-ring">
            <Logo />
          </Link>
        </div>
        <div className="border-b border-border px-4 py-3">
          <RestaurantSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t border-border p-3">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
            <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="rtl-flip" aria-hidden />
              {t.dashboard.viewPublicMenu}
            </a>
          </Button>
        </div>
      </aside>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t.dashboard.overview}
          >
            <MenuIcon />
          </Button>

          <Link href="/dashboard" className="lg:hidden">
            <LogoMark className="size-7" />
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <RestaurantSwitcher compact />
          </div>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-semibold">{restaurant.name}</p>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex lg:hidden">
              <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noreferrer" aria-label={t.dashboard.viewPublicMenu}>
                <ExternalLink className="rtl-flip" />
              </a>
            </Button>
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-sand-950/45"
            onClick={() => setMobileOpen(false)}
            aria-label={t.common.close}
          />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-pop animate-fade-in">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label={t.common.close}>
                <X />
              </Button>
            </div>
            <div className="border-b border-border px-4 py-3">
              <RestaurantSwitcher />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border p-3">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="rtl-flip" aria-hidden />
                  {t.dashboard.viewPublicMenu}
                </a>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
