"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatLongDate } from "@/lib/i18n/format-date";
import type { EventItem, InvitationData, TemplateTheme } from "@/types/invitation";

const STRINGS = {
  ar: { title: "تفاصيل المناسبة", eyebrow: "البرنامج", date: "التاريخ", time: "الساعة", venue: "المكان" },
  fr: { title: "Le programme", eyebrow: "Détails", date: "Date", time: "Heure", venue: "Lieu" },
  en: { title: "The Celebration", eyebrow: "Details", date: "Date", time: "Time", venue: "Venue" },
};

/** A label/value pair set as a printed line, not a list item with an icon. */
function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="text-[0.5rem] uppercase"
        style={{ color: "var(--inv-primary)", letterSpacing: "0.36em", opacity: 0.8 }}
      >
        {label}
      </span>
      <span className="text-[1rem]" style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}>
        {value}
      </span>
    </div>
  );
}

function EventBlock({ event, t, locale }: { event: EventItem; t: (typeof STRINGS)["ar"]; locale: "ar" | "fr" | "en" }) {
  const lines = [
    event.date ? { label: t.date, value: formatLongDate(new Date(`${event.date}T00:00:00`), locale) } : null,
    event.time ? { label: t.time, value: event.time } : null,
    event.locationName ? { label: t.venue, value: event.locationName } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="flex flex-col items-center">
      <h3
        className="text-[1.25rem]"
        style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)", letterSpacing: "0.04em" }}
      >
        {event.name}
      </h3>
      <div className="mt-7 flex flex-col items-center gap-6">
        {lines.map((line) => (
          <DetailLine key={line.label} label={line.label} value={line.value} />
        ))}
      </div>
    </div>
  );
}

export function EventDetailsSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  if (invitation.events.length === 0) return null;

  return (
    <SectionShell>
      <SectionHeading title={t.title} eyebrow={t.eyebrow} theme={theme} />

      <div className="mt-12 flex flex-col items-center">
        {invitation.events.map((event, i) => (
          <Reveal key={event.id} delay={i * 110} className="w-full">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="mx-auto my-11 block h-px w-16"
                style={{ backgroundColor: "var(--inv-primary)", opacity: 0.28 }}
              />
            )}
            <EventBlock event={event} t={t} locale={locale} />
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
