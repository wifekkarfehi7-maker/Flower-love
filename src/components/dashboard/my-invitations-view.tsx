"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Eye, Heart, Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/provider";
import { deleteInvitation, duplicateInvitation } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
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

export function MyInvitationsView({
  profile,
  invitations: initialInvitations,
}: {
  profile: ProfileRow | null;
  invitations: InvitationRow[];
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
          <h1 className="font-heading text-3xl font-bold text-ink-900">{t.dashboard.title}</h1>
        </div>

        {invitations.length === 0 ? (
          <Card className="mt-10 flex flex-col items-center gap-4 border-dashed p-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient shadow-soft">
              <Heart className="h-7 w-7 text-ink-950" fill="currentColor" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-ink-900">{t.dashboard.emptyTitle}</p>
              <p className="mt-2 max-w-sm text-sm text-ink-500">{t.dashboard.emptyDescription}</p>
            </div>
            <Button asChild variant="gold" size="lg" className="mt-2">
              <Link href="/invitations/new">
                <Plus className="h-4 w-4" />
                {t.dashboard.createCta}
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            <div className="mt-8 flex justify-end">
              <Button asChild variant="gold">
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
                    <p className="font-heading text-lg font-semibold text-ink-900">
                      {invitation.groom_name || "—"} &amp; {invitation.bride_name || "—"}
                    </p>
                    <Badge variant={STATUS_BADGE_VARIANT[invitation.status]}>
                      {statusLabel[invitation.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-ink-400">
                    {new Date(invitation.created_at).toLocaleDateString(locale === "ar" ? "ar-TN" : locale)}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
                    <Eye className="h-3.5 w-3.5" />
                    {invitation.view_count}
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
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
                </Card>
              ))}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
