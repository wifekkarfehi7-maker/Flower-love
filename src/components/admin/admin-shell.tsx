"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  ScrollText,
  Tags,
  Users,
  X,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/use-translation";
import { useAuth } from "@/lib/auth/provider";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    badge: "لوحة الإدارة",
    overview: "نظرة عامة",
    orders: "الطلبات",
    invitations: "الدعوات",
    users: "المستخدمون",
    templates: "التصاميم",
    pricing: "الأسعار",
    audit: "سجل النشاط",
    backToSite: "العودة إلى الموقع",
    signOut: "تسجيل الخروج",
  },
  fr: {
    badge: "Administration",
    overview: "Vue d'ensemble",
    orders: "Commandes",
    invitations: "Invitations",
    users: "Utilisateurs",
    templates: "Modèles",
    pricing: "Tarifs",
    audit: "Journal d'activité",
    backToSite: "Retour au site",
    signOut: "Déconnexion",
  },
  en: {
    badge: "Admin dashboard",
    overview: "Overview",
    orders: "Orders",
    invitations: "Invitations",
    users: "Users",
    templates: "Templates",
    pricing: "Pricing",
    audit: "Audit log",
    backToSite: "Back to site",
    signOut: "Sign out",
  },
};

export function AdminShell({ adminName, children }: { adminName: string | null; children: React.ReactNode }) {
  const { locale } = useTranslation();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const t = STRINGS[locale];
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { href: "/admin", label: t.overview, icon: LayoutDashboard },
    { href: "/admin/orders", label: t.orders, icon: ClipboardList },
    { href: "/admin/invitations", label: t.invitations, icon: Heart },
    { href: "/admin/users", label: t.users, icon: Users },
    { href: "/admin/templates", label: t.templates, icon: Palette },
    { href: "/admin/pricing", label: t.pricing, icon: Tags },
    { href: "/admin/audit", label: t.audit, icon: ScrollText },
  ];

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  function navList(onNavigate?: () => void) {
    return (
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-gold-500/15 text-gold-300" : "text-ink-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  function footerActions(onNavigate?: () => void) {
    return (
      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 px-3 pt-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4 rotate-180" />
          {t.backToSite}
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink-950 py-6 lg:flex">
        <div className="px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient shadow-soft">
              <Heart className="h-4 w-4 text-ink-950" fill="currentColor" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold text-white">Flower &amp; Love</p>
              <p className="text-[11px] text-ink-400">{t.badge}</p>
            </div>
          </Link>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">{navList()}</div>
        {footerActions()}
      </aside>

      {/* Mobile slide-in sidebar (overlay only, no separate content mount) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex h-full w-72 flex-col bg-ink-950 py-6 animate-fade-in">
            <div className="flex items-center justify-between px-5">
              <p className="font-heading text-sm font-semibold text-white">{t.badge}</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">{navList(() => setMobileOpen(false))}</div>
            {footerActions(() => setMobileOpen(false))}
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-black/40"
          />
        </div>
      )}

      {/* Content column — rendered once, shared by mobile and desktop */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-heading text-sm font-semibold text-ink-900">{t.badge}</p>
          <span className="w-9" />
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <p className="hidden text-sm text-ink-400 lg:block">{adminName ? `${t.badge} — ${adminName}` : t.badge}</p>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
