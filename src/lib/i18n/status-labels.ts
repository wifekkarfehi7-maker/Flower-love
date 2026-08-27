import type { InvitationStatus, OrderStatus } from "@/types/database";
import type { Locale } from "@/lib/i18n/config";

/** Shared ar/fr/en labels for invitation/order status (the two enums share the same values). */
export const STATUS_LABELS: Record<Locale, Record<InvitationStatus, string>> = {
  ar: {
    draft: "مسودة",
    pending_payment: "بانتظار الدفع",
    payment_review: "قيد المراجعة",
    paid: "تم الدفع",
    active: "منشورة",
    cancelled: "ملغاة",
    expired: "منتهية",
  },
  fr: {
    draft: "Brouillon",
    pending_payment: "En attente de paiement",
    payment_review: "En vérification",
    paid: "Payée",
    active: "Publiée",
    cancelled: "Annulée",
    expired: "Expirée",
  },
  en: {
    draft: "Draft",
    pending_payment: "Pending payment",
    payment_review: "Under review",
    paid: "Paid",
    active: "Published",
    cancelled: "Cancelled",
    expired: "Expired",
  },
};

export function statusLabel(status: InvitationStatus | OrderStatus, locale: Locale): string {
  return STATUS_LABELS[locale][status];
}
