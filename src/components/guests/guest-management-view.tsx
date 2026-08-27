"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/container";
import { StatTiles } from "./stat-tiles";
import { RsvpResponsesTable } from "./rsvp-responses-table";
import { GuestListTable } from "./guest-list-table";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { GuestRow, InvitationRow, RsvpRow } from "@/types/database";

const STRINGS = {
  ar: { back: "دعواتي" },
  fr: { back: "Mes invitations" },
  en: { back: "My Invitations" },
};

export function GuestManagementView({
  invitation,
  guests,
  rsvps,
}: {
  invitation: InvitationRow;
  guests: GuestRow[];
  rsvps: RsvpRow[];
}) {
  const { locale, dir } = useTranslation();
  const t = STRINGS[locale];
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const attending = rsvps.filter((r) => r.attendance === "attending").reduce((sum, r) => sum + r.guest_count, 0);
  const notAttending = rsvps.filter((r) => r.attendance === "not_attending").length;
  const pending = guests.filter((g) => g.status === "pending").length;
  const totalGuests = guests.reduce((sum, g) => sum + g.guest_count, 0);

  return (
    <section className="bg-ink-50/60 py-10 sm:py-14">
      <Container className="max-w-4xl">
        <Link href="/my-invitations" className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
          <BackIcon className="h-4 w-4" />
          {t.back}
        </Link>

        <h1 className="mt-3 font-heading text-2xl font-bold text-ink-900 sm:text-3xl">
          {invitation.groom_name || "—"} &amp; {invitation.bride_name || "—"}
        </h1>

        <div className="mt-6">
          <StatTiles
            locale={locale}
            views={invitation.view_count}
            attending={attending}
            notAttending={notAttending}
            pending={pending}
            totalGuests={totalGuests}
          />
        </div>

        <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
          <RsvpResponsesTable rsvps={rsvps} locale={locale} />
        </div>

        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
          <GuestListTable invitationId={invitation.id} guests={guests} locale={locale} />
        </div>
      </Container>
    </section>
  );
}
