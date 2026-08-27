"use client";

import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/use-translation";
import { statusLabel } from "@/lib/i18n/status-labels";
import { formatShortDate } from "@/lib/i18n/format-date";
import { SITE_URL } from "@/lib/config";
import type { AdminInvitationSummary } from "@/lib/admin/invitations";
import type { InvitationStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_BADGE_VARIANT: Record<InvitationStatus, BadgeProps["variant"]> = {
  draft: "soft",
  pending_payment: "outline",
  payment_review: "outline",
  paid: "gold",
  active: "success",
  cancelled: "destructive",
  expired: "destructive",
};

const ALL_STATUSES: InvitationStatus[] = [
  "draft",
  "pending_payment",
  "payment_review",
  "paid",
  "active",
  "cancelled",
  "expired",
];

const STRINGS = {
  ar: {
    title: "الدعوات",
    all: "الكل",
    empty: "لا توجد دعوات في هذه الفئة.",
    couple: "الأسماء",
    owner: "صاحب الحساب",
    views: "المشاهدات",
    status: "الحالة",
    date: "تاريخ الإنشاء",
    preview: "معاينة",
  },
  fr: {
    title: "Invitations",
    all: "Toutes",
    empty: "Aucune invitation dans cette catégorie.",
    couple: "Noms",
    owner: "Propriétaire",
    views: "Vues",
    status: "Statut",
    date: "Créée le",
    preview: "Aperçu",
  },
  en: {
    title: "Invitations",
    all: "All",
    empty: "No invitations in this category.",
    couple: "Names",
    owner: "Owner",
    views: "Views",
    status: "Status",
    date: "Created",
    preview: "Preview",
  },
};

export function AdminInvitationsView({
  invitations,
  activeStatus,
}: {
  invitations: AdminInvitationSummary[];
  activeStatus: InvitationStatus | null;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  return (
    <div className="mt-6">
      <h1 className="font-heading text-2xl font-bold text-ink-900">{t.title}</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/admin/invitations"
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
            href={`/admin/invitations?status=${status}`}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeStatus === status ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
            )}
          >
            {statusLabel(status, locale)}
          </Link>
        ))}
      </div>

      {invitations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">
          {t.empty}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs text-ink-400">
                <th className="px-4 py-3 text-start font-medium">{t.couple}</th>
                <th className="px-4 py-3 text-start font-medium">{t.owner}</th>
                <th className="px-4 py-3 text-start font-medium">{t.views}</th>
                <th className="px-4 py-3 text-start font-medium">{t.status}</th>
                <th className="px-4 py-3 text-start font-medium">{t.date}</th>
                <th className="px-4 py-3 text-start font-medium" />
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {invitation.groom_name || "—"} &amp; {invitation.bride_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{invitation.ownerName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      {invitation.view_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE_VARIANT[invitation.status]}>
                      {statusLabel(invitation.status, locale)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-400" dir="ltr">
                    {formatShortDate(new Date(invitation.created_at), locale)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={
                        invitation.status === "active" && invitation.slug
                          ? `${SITE_URL}/invite/${invitation.slug}`
                          : `/invitations/${invitation.id}/preview`
                      }
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gold-700 hover:underline"
                    >
                      {t.preview}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
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
