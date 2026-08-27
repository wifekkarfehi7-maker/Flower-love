"use client";

import Link from "next/link";
import { ClipboardList, Coins, Heart, ShoppingBag, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/use-translation";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AdminOverview } from "@/lib/admin/overview";
import type { OrderStatus } from "@/types/database";

const STATUS_BADGE_VARIANT: Record<OrderStatus, BadgeProps["variant"]> = {
  draft: "soft",
  pending_payment: "outline",
  payment_review: "outline",
  paid: "gold",
  active: "success",
  cancelled: "destructive",
  expired: "destructive",
};

const STRINGS = {
  ar: {
    title: "نظرة عامة",
    users: "المستخدمون",
    invitations: "الدعوات",
    activeInvitations: "دعوات منشورة",
    pendingOrders: "طلبات بانتظار المعالجة",
    revenue: "إيرادات هذا الشهر",
    recentOrders: "أحدث الطلبات",
    noOrders: "لا توجد طلبات بعد.",
    viewAll: "عرض كل الطلبات",
    customer: "العميل",
    couple: "الدعوة",
    plan: "الباقة",
    status: "الحالة",
  },
  fr: {
    title: "Vue d'ensemble",
    users: "Utilisateurs",
    invitations: "Invitations",
    activeInvitations: "Invitations publiées",
    pendingOrders: "Commandes en attente",
    revenue: "Revenus ce mois-ci",
    recentOrders: "Commandes récentes",
    noOrders: "Aucune commande pour le moment.",
    viewAll: "Voir toutes les commandes",
    customer: "Client",
    couple: "Invitation",
    plan: "Formule",
    status: "Statut",
  },
  en: {
    title: "Overview",
    users: "Users",
    invitations: "Invitations",
    activeInvitations: "Published invitations",
    pendingOrders: "Orders pending action",
    revenue: "Revenue this month",
    recentOrders: "Recent orders",
    noOrders: "No orders yet.",
    viewAll: "View all orders",
    customer: "Customer",
    couple: "Invitation",
    plan: "Plan",
    status: "Status",
  },
};

export function OverviewView({ overview }: { overview: AdminOverview }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  const tiles = [
    { icon: Users, label: t.users, value: overview.totalUsers },
    { icon: Heart, label: t.invitations, value: overview.totalInvitations },
    { icon: ShoppingBag, label: t.activeInvitations, value: overview.activeInvitations },
    { icon: ClipboardList, label: t.pendingOrders, value: overview.pendingOrdersCount },
  ];

  return (
    <div className="mt-6">
      <h1 className="font-heading text-2xl font-bold text-ink-900">{t.title}</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <tile.icon className="h-5 w-5 text-gold-600" />
            <p className="mt-3 font-heading text-2xl font-bold text-ink-900">{tile.value}</p>
            <p className="mt-0.5 text-xs text-ink-500">{tile.label}</p>
          </Card>
        ))}
        <Card className="col-span-2 p-4 sm:col-span-4">
          <Coins className="h-5 w-5 text-gold-600" />
          <p className="mt-3 font-heading text-2xl font-bold text-ink-900" dir="ltr">
            {overview.revenueThisMonth.toFixed(2)} TND
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{t.revenue}</p>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-ink-900">{t.recentOrders}</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-gold-700 hover:underline">
            {t.viewAll}
          </Link>
        </div>

        {overview.recentOrders.length === 0 ? (
          <Card className="mt-4 p-8 text-center text-sm text-ink-500">{t.noOrders}</Card>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs text-ink-400">
                  <th className="px-4 py-3 text-start font-medium">{t.customer}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.couple}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.plan}</th>
                  <th className="px-4 py-3 text-start font-medium">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink-900 hover:text-gold-700">
                        {order.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{order.invitationCoupleNames}</td>
                    <td className="px-4 py-3 text-ink-600">{order.plan_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{statusLabel(order.status, locale)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
