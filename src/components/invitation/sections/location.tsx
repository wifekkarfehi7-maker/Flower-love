"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import { buttonClass } from "../theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import { resolveLocationUrl } from "@/lib/maps";
import type { InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: { title: "موقع الحفل", eyebrow: "أين نلتقي", cta: "افتح الخريطة", newTab: "يفتح في نافذة جديدة" },
  fr: { title: "Le lieu", eyebrow: "Où nous retrouver", cta: "Ouvrir la carte", newTab: "s'ouvre dans un nouvel onglet" },
  en: { title: "The Venue", eyebrow: "Where we gather", cta: "Open the map", newTab: "opens in a new tab" },
};

/** An engraved marker — a drawn line, not a filled UI icon. */
function PinMark() {
  return (
    <svg viewBox="0 0 24 32" className="h-7 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 31C12 31 21.5 19.8 21.5 12.2A9.5 9.5 0 0 0 2.5 12.2C2.5 19.8 12 31 12 31Z"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function LocationSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  const event = invitation.events.find((e) => e.locationUrl || e.locationName) ?? invitation.events[0];
  const mapsUrl = event ? resolveLocationUrl(event) : null;
  if (!event || !mapsUrl) return null;

  return (
    <SectionShell>
      <SectionHeading title={t.title} eyebrow={t.eyebrow} theme={theme} />

      <Reveal delay={110} className="mt-12 flex flex-col items-center">
        <span style={{ color: "var(--inv-primary)", opacity: 0.7 }}>
          <PinMark />
        </span>

        {event.locationName && (
          <p
            className="mt-6 max-w-[20rem] text-[1.2rem] leading-relaxed"
            style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)", letterSpacing: "0.03em" }}
          >
            {event.locationName}
          </p>
        )}

        <span
          aria-hidden="true"
          className="mt-9 block h-px w-14"
          style={{ backgroundColor: "var(--inv-primary)", opacity: 0.35 }}
        />

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonClass(theme.buttonStyle), "mt-9")}
          style={{ borderColor: "var(--inv-primary)", color: "var(--inv-primary)" }}
        >
          {t.cta}
          <span className="sr-only"> — {t.newTab}</span>
        </a>
      </Reveal>
    </SectionShell>
  );
}
