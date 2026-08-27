"use client";

import Link from "next/link";
import { Eye, Heart, Plus } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationRow, InvitationStatus, ProfileRow } from "@/types/database";

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
  invitations,
}: {
  profile: ProfileRow | null;
  invitations: InvitationRow[];
}) {
  const { t, locale } = useTranslation();

  const statusLabel: Record<InvitationStatus, string> = {
    draft: t.dashboard.statusDraft,
    pending_payment: t.dashboard.statusPendingPayment,
    payment_review: t.dashboard.statusPaymentReview,
    paid: t.dashboard.statusPaid,
    active: t.dashboard.statusActive,
    cancelled: t.dashboard.statusCancelled,
    expired: t.dashboard.statusExpired,
  };

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
                <Card key={invitation.id} className="flex flex-col p-6">
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
                  <Button asChild variant="outline" size="sm" className="mt-5">
                    <Link href={`/invitations/${invitation.id}`}>{t.dashboard.createCta}</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
