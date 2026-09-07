import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
  QrCode,
  Settings,
  Store,
  Table2,
  Tags,
  UtensilsCrossed,
} from "lucide-react";

import type { Capability } from "@/lib/permissions";
import type { Dictionary } from "@/lib/i18n/types";

export interface NavItem {
  href: string;
  label: (t: Dictionary) => string;
  icon: LucideIcon;
  capability?: Capability;
  /** Marks the item active for nested routes too. */
  exact?: boolean;
}

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: (t) => t.dashboard.overview, icon: LayoutDashboard, exact: true },
  { href: "/dashboard/menu", label: (t) => t.dashboard.menu, icon: UtensilsCrossed },
  { href: "/dashboard/categories", label: (t) => t.dashboard.categories, icon: Tags },
  { href: "/dashboard/products", label: (t) => t.dashboard.products, icon: UtensilsCrossed },
  { href: "/dashboard/tables", label: (t) => t.dashboard.tables, icon: Table2 },
  { href: "/dashboard/qr", label: (t) => t.dashboard.qrCodes, icon: QrCode },
  { href: "/dashboard/analytics", label: (t) => t.dashboard.analytics, icon: BarChart3, capability: "analytics:view" },
  { href: "/dashboard/restaurant", label: (t) => t.dashboard.restaurant, icon: Store, capability: "restaurant:write" },
  { href: "/dashboard/settings", label: (t) => t.dashboard.settings, icon: Settings },
  {
    href: "/dashboard/subscription",
    label: (t) => t.dashboard.subscription,
    icon: CreditCard,
    capability: "subscription:manage",
  },
];
