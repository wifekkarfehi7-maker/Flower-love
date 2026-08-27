"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useTranslation } from "@/lib/i18n/use-translation";
import { statusLabel } from "@/lib/i18n/status-labels";
import { formatDateTime } from "@/lib/i18n/format-date";
import { activateOrder, cancelOrder, confirmOrderPayment } from "@/lib/admin/orders-client";
import { SITE_URL } from "@/lib/config";
import type { AdminOrderDetail } from "@/lib/admin/orders";
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
    back: "الطلبات",
    orderNumber: "طلب رقم",
    customer: "معلومات العميل",
    name: "الاسم",
    whatsapp: "واتساب",
    contactCustomer: "تواصل عبر واتساب",
    invitation: "الدعوة",
    couple: "الأسماء",
    weddingDate: "تاريخ الزفاف",
    invitationStatus: "حالة الدعوة",
    viewInvitation: "معاينة الدعوة",
    viewPublic: "فتح الدعوة العامة",
    orderInfo: "تفاصيل الطلب",
    plan: "الباقة",
    price: "السعر",
    createdAt: "تاريخ الطلب",
    paidAt: "تاريخ الدفع",
    activatedAt: "تاريخ التفعيل",
    notes: "ملاحظات الإدارة",
    confirmPayment: "تأكيد استلام الدفع",
    activate: "تفعيل ونشر الدعوة",
    cancelOrder: "إلغاء الطلب",
    cancelReasonPrompt: "سبب الإلغاء (اختياري):",
    activated: "تم تفعيل الدعوة",
    error: "حدث خطأ، الرجاء المحاولة مجدداً.",
    finalStateNote: "لا توجد إجراءات متاحة لهذا الطلب.",
  },
  fr: {
    back: "Commandes",
    orderNumber: "Commande n°",
    customer: "Informations client",
    name: "Nom",
    whatsapp: "WhatsApp",
    contactCustomer: "Contacter sur WhatsApp",
    invitation: "Invitation",
    couple: "Noms",
    weddingDate: "Date du mariage",
    invitationStatus: "Statut de l'invitation",
    viewInvitation: "Aperçu de l'invitation",
    viewPublic: "Ouvrir l'invitation publique",
    orderInfo: "Détails de la commande",
    plan: "Formule",
    price: "Prix",
    createdAt: "Date de commande",
    paidAt: "Date de paiement",
    activatedAt: "Date d'activation",
    notes: "Notes admin",
    confirmPayment: "Confirmer le paiement reçu",
    activate: "Activer et publier",
    cancelOrder: "Annuler la commande",
    cancelReasonPrompt: "Motif de l'annulation (optionnel) :",
    activated: "Invitation activée",
    error: "Une erreur est survenue, veuillez réessayer.",
    finalStateNote: "Aucune action disponible pour cette commande.",
  },
  en: {
    back: "Orders",
    orderNumber: "Order",
    customer: "Customer info",
    name: "Name",
    whatsapp: "WhatsApp",
    contactCustomer: "Contact on WhatsApp",
    invitation: "Invitation",
    couple: "Names",
    weddingDate: "Wedding date",
    invitationStatus: "Invitation status",
    viewInvitation: "Preview invitation",
    viewPublic: "Open public invitation",
    orderInfo: "Order details",
    plan: "Plan",
    price: "Price",
    createdAt: "Ordered",
    paidAt: "Paid",
    activatedAt: "Activated",
    notes: "Admin notes",
    confirmPayment: "Confirm payment received",
    activate: "Activate & publish",
    cancelOrder: "Cancel order",
    cancelReasonPrompt: "Cancellation reason (optional):",
    activated: "Invitation activated",
    error: "Something went wrong, please try again.",
    finalStateNote: "No actions available for this order.",
  },
};

export function OrderDetailView({ detail }: { detail: AdminOrderDetail }) {
  const { locale, dir } = useTranslation();
  const router = useRouter();
  const t = STRINGS[locale];
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [order, setOrder] = React.useState(detail.order);
  const [invitation, setInvitation] = React.useState(detail.invitation);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleConfirmPayment() {
    setBusy(true);
    setError(null);
    const result = await confirmOrderPayment(order);
    setBusy(false);
    if (result.error) {
      setError(t.error);
      return;
    }
    setOrder((prev) => ({ ...prev, status: "paid", paid_at: new Date().toISOString() }));
    setInvitation((prev) => ({ ...prev, status: "paid" }));
    router.refresh();
  }

  async function handleActivate() {
    setBusy(true);
    setError(null);
    const result = await activateOrder(order, invitation);
    setBusy(false);
    if (result.error || !result.data) {
      setError(t.error);
      return;
    }
    setOrder((prev) => ({ ...prev, status: "active", activated_at: new Date().toISOString() }));
    setInvitation((prev) => ({
      ...prev,
      status: "active",
      slug: result.data!.slug,
      is_watermarked: false,
      published_at: new Date().toISOString(),
    }));
    router.refresh();
  }

  async function handleCancel() {
    const reason = window.prompt(t.cancelReasonPrompt) ?? "";
    setBusy(true);
    setError(null);
    const result = await cancelOrder(order, reason);
    setBusy(false);
    if (result.error) {
      setError(t.error);
      return;
    }
    setOrder((prev) => ({ ...prev, status: "cancelled", admin_notes: reason || null }));
    setInvitation((prev) => ({ ...prev, status: "draft" }));
    router.refresh();
  }

  const coupleNames = `${invitation.groom_name ?? ""} & ${invitation.bride_name ?? ""}`;
  const canConfirmPayment = order.status === "pending_payment" || order.status === "payment_review";
  const canActivate = order.status === "paid";
  const canCancel = order.status !== "cancelled" && order.status !== "active" && order.status !== "expired";

  return (
    <div className="mt-6">
      <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <BackIcon className="h-4 w-4" />
        {t.back}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900" dir="ltr">
            {t.orderNumber} {order.order_number}
          </h1>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{statusLabel(order.status, locale)}</Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-base font-bold text-ink-900">{t.customer}</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">{t.name}</dt>
              <dd className="font-medium text-ink-900">{order.customer_name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">{t.whatsapp}</dt>
              <dd className="font-medium text-ink-900" dir="ltr">
                {order.customer_whatsapp}
              </dd>
            </div>
          </dl>
          <WhatsAppButton
            message={`مرحباً ${order.customer_name}، بخصوص طلبكم رقم ${order.order_number}...`}
            phone={order.customer_whatsapp}
            size="sm"
            className="mt-4 w-full"
          >
            {t.contactCustomer}
          </WhatsAppButton>
        </Card>

        <Card className="p-5">
          <h2 className="font-heading text-base font-bold text-ink-900">{t.invitation}</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">{t.couple}</dt>
              <dd className="font-medium text-ink-900">{coupleNames}</dd>
            </div>
            {invitation.wedding_date && (
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{t.weddingDate}</dt>
                <dd className="font-medium text-ink-900" dir="ltr">
                  {invitation.wedding_date}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">{t.invitationStatus}</dt>
              <dd>
                <Badge variant={STATUS_BADGE_VARIANT[invitation.status]}>{statusLabel(invitation.status, locale)}</Badge>
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/invitations/${invitation.id}/preview`} target="_blank">
                {t.viewInvitation}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {invitation.status === "active" && invitation.slug && (
              <Button asChild variant="gold" size="sm" className="flex-1">
                <Link href={`${SITE_URL}/invite/${invitation.slug}`} target="_blank">
                  {t.viewPublic}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="font-heading text-base font-bold text-ink-900">{t.orderInfo}</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">{t.plan}</dt>
              <dd className="font-medium text-ink-900">{order.plan_name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">{t.price}</dt>
              <dd className="font-medium text-ink-900" dir="ltr">
                {order.price} {order.currency}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-500">{t.createdAt}</dt>
              <dd className="text-ink-700" dir="ltr">
                {formatDateTime(new Date(order.created_at), locale)}
              </dd>
            </div>
            {order.paid_at && (
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{t.paidAt}</dt>
                <dd className="text-ink-700" dir="ltr">
                  {formatDateTime(new Date(order.paid_at), locale)}
                </dd>
              </div>
            )}
            {order.activated_at && (
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">{t.activatedAt}</dt>
                <dd className="text-ink-700" dir="ltr">
                  {formatDateTime(new Date(order.activated_at), locale)}
                </dd>
              </div>
            )}
          </dl>
          {order.admin_notes && (
            <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm text-ink-600">
              <span className="font-medium text-ink-800">{t.notes}: </span>
              {order.admin_notes}
            </p>
          )}
        </Card>
      </div>

      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {canConfirmPayment && (
          <Button variant="gold" onClick={handleConfirmPayment} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t.confirmPayment}
          </Button>
        )}
        {canActivate && (
          <Button variant="gold" onClick={handleActivate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t.activate}
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={handleCancel} disabled={busy}>
            <XCircle className="h-4 w-4" />
            {t.cancelOrder}
          </Button>
        )}
        {!canConfirmPayment && !canActivate && !canCancel && (
          <p className="text-sm text-ink-400">{t.finalStateNote}</p>
        )}
      </div>
    </div>
  );
}
