"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, CalendarCheck, Copy, Eye, HelpCircle, Loader2, MoreVertical, Pencil, Plus, Share2, Trash2, Users } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/provider";
import { deleteInvitation, duplicateInvitation } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatShortDate } from "@/lib/i18n/format-date";
import type { InvitationRow, InvitationStatus, ProfileRow } from "@/types/database";
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

export interface InvitationStats {
  attending: number;
  pending: number;
}

export function MyInvitationsView({
  profile,
  invitations: initialInvitations,
  stats = {},
}: {
  profile: ProfileRow | null;
  invitations: InvitationRow[];
  stats?: Record<string, InvitationStats>;
}) {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const [invitations, setInvitations] = React.useState(initialInvitations);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [menuId, setMenuId] = React.useState<string | null>(null);

  const statusLabel: Record<InvitationStatus, string> = {
    draft: t.dashboard.statusDraft,
    pending_payment: t.dashboard.statusPendingPayment,
    payment_review: t.dashboard.statusPaymentReview,
    paid: t.dashboard.statusPaid,
    active: t.dashboard.statusActive,
    cancelled: t.dashboard.statusCancelled,
    expired: t.dashboard.statusExpired,
  };

  async function handleDuplicate(invitation: InvitationRow) {
    if (!user) return;
    setMenuId(null);
    setBusyId(invitation.id);
    const result = await duplicateInvitation(invitation, user.id);
    setBusyId(null);
    if (result.data) {
      router.push(`/invitations/${result.data.id}/builder`);
    }
  }

  async function handleDelete(invitation: InvitationRow) {
    setMenuId(null);
    if (!window.confirm(t.dashboard.deleteConfirm)) return;
    setBusyId(invitation.id);
    const result = await deleteInvitation(invitation.id);
    setBusyId(null);
    if (!result.error) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    }
  }

  return (
    <section className="bg-ink-50/60 py-12 sm:py-16">
      <Container>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-ink-500">
            {t.dashboard.welcomePrefix}
            {profile?.full_name ? `, ${profile.full_name}` : ""} 👋
          </p>
          <h1 className="type-h1">{t.dashboard.title}</h1>
        </div>

        {invitations.length === 0 ? (
          <div className="mt-block flex flex-col items-center border-y border-ink-900/10 px-6 py-section-sm text-center">
            <span aria-hidden="true" className="block h-px w-12 bg-gold-500/60" />
            <p className="type-h2 mt-8">{t.dashboard.emptyTitle}</p>
            <p className="type-body mt-4 max-w-sm">{t.dashboard.emptyDescription}</p>
            <Button asChild variant="primary" size="lg" className="mt-10">
              <Link href="/invitations/new">
                <Plus className="h-4 w-4" />
                {t.dashboard.createCta}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-8 flex justify-end">
              <Button asChild variant="primary">
                <Link href="/invitations/new">
                  <Plus className="h-4 w-4" />
                  {t.dashboard.createCta}
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="relative flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-heading text-lg text-ink-900">
                      {invitation.groom_name || "—"} &amp; {invitation.bride_name || "—"}
                    </p>
                    <Badge variant={STATUS_BADGE_VARIANT[invitation.status]}>
                      {statusLabel[invitation.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-ink-400" dir="ltr">
                    {formatShortDate(new Date(invitation.created_at), locale)}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      {invitation.view_count}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {stats[invitation.id]?.attending ?? 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-gold-600">
                      <HelpCircle className="h-3.5 w-3.5" />
                      {stats[invitation.id]?.pending ?? 0}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <Button asChild variant="secondary" size="sm" className="flex-1">
                      <Link href={`/invitations/${invitation.id}/builder`}>
                        <Pencil className="h-3.5 w-3.5" />
                        {t.dashboard.edit}
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="px-3">
                      <Link href={`/invitations/${invitation.id}/preview`} aria-label={t.dashboard.preview}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="px-3">
                      <Link href={`/invitations/${invitation.id}/guests`} aria-label={t.dashboard.guests}>
                        <Users className="h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuId(menuId === invitation.id ? null : invitation.id)}
                        disabled={busyId === invitation.id}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 hover:bg-ink-50"
                      >
                        {busyId === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </button>

                      {menuId === invitation.id && (
                        <div className="absolute end-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-card">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(invitation)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            <Copy className="h-4 w-4" />
                            {t.dashboard.duplicate}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(invitation)}
                            className={cn(
                              "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5"
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t.dashboard.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-ink-900/[0.06] pt-3">
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href={`/invitations/${invitation.id}/share`}>
                        <Share2 className="h-3.5 w-3.5" />
                        {t.dashboard.share}
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href={`/invitations/${invitation.id}/stats`}>
                        <BarChart3 className="h-3.5 w-3.5" />
                        {t.dashboard.stats}
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
