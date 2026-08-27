"use client";

import Link from "next/link";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/use-translation";
import { statusLabel } from "@/lib/i18n/status-labels";
import { formatShortDate } from "@/lib/i18n/format-date";
import type { AdminOrderSummary } from "@/lib/admin/orders";
import type { OrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_BADGE_VARIANT: Record<OrderStatus, BadgeProps["variant"]> = {
  draft: "soft",
  pending_payment: "outline",
  payment_review: "outline",
  paid: "gold",
  active: "success",
  cancelled: "destructive",
  expired: "destructive",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending_payment",
  "payment_review",
  "paid",
  "active",
  "cancelled",
  "expired",
  "draft",
];

const STRINGS = {
  ar: {
    title: "الطلبات",
    all: "الكل",
    empty: "لا توجد طلبات في هذه الفئة.",
    orderNumber: "رقم الطلب",
    customer: "العميل",
    couple: "الدعوة",
    plan: "الباقة",
    price: "السعر",
    status: "الحالة",
    date: "التاريخ",
  },
  fr: {
    title: "Commandes",
    all: "Toutes",
    empty: "Aucune commande dans cette catégorie.",
    orderNumber: "N° de commande",
    customer: "Client",
    couple: "Invitation",
    plan: "Formule",
    price: "Prix",
    status: "Statut",
    date: "Date",
  },
  en: {
    title: "Orders",
    all: "All",
    empty: "No orders in this category.",
    orderNumber: "Order #",
    customer: "Customer",
    couple: "Invitation",
    plan: "Plan",
    price: "Price",
    status: "Status",
    date: "Date",
  },
};

export function OrdersListView({
  orders,
  activeStatus,
}: {
  orders: AdminOrderSummary[];
  activeStatus: OrderStatus | null;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  return (
    <div className="mt-6">
      <h1 className="font-heading text-2xl font-bold text-ink-900">{t.title}</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/admin/orders"
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeStatus === null ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
          )}
        >
          {t.all}
        </Link>
        {ALL_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeStatus === status ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
            )}
          >
            {statusLabel(status, locale)}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">
          {t.empty}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[760px] text-start text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs text-ink-400">
                <th className="px-4 py-3 text-start font-medium">{t.orderNumber}</th>
                <th className="px-4 py-3 text-start font-medium">{t.customer}</th>
                <th className="px-4 py-3 text-start font-medium">{t.couple}</th>
                <th className="px-4 py-3 text-start font-medium">{t.plan}</th>
                <th className="px-4 py-3 text-start font-medium">{t.price}</th>
                <th className="px-4 py-3 text-start font-medium">{t.status}</th>
                <th className="px-4 py-3 text-start font-medium">{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-ink-900 hover:text-gold-700"
                      dir="ltr"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{order.customer_name}</td>
                  <td className="px-4 py-3 text-ink-600">{order.invitationCoupleNames}</td>
                  <td className="px-4 py-3 text-ink-600">{order.plan_name}</td>
                  <td className="px-4 py-3 text-ink-600" dir="ltr">
                    {order.price} {order.currency}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{statusLabel(order.status, locale)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-400" dir="ltr">
                    {formatShortDate(new Date(order.created_at), locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
