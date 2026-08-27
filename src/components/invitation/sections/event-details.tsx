import { CalendarDays, Clock, MapPin } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { Divider } from "../divider";
import { radiusClass } from "../theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatLongDate } from "@/lib/i18n/format-date";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const TITLES = { ar: "تفاصيل المناسبة", fr: "Détails de la fête", en: "Event details" };

function formatDate(date: string | null, locale: "ar" | "fr" | "en") {
  if (!date) return "";
  return formatLongDate(new Date(`${date}T00:00:00`), locale);
}

export function EventDetailsSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  if (invitation.events.length === 0) return null;

  return (
    <section className="px-6 py-16 text-center">
      <Reveal>
        <p
          className="text-2xl font-bold sm:text-3xl"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
        >
          {TITLES[locale]}
        </p>
        <Divider theme={theme} />
      </Reveal>

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-4">
        {invitation.events.map((event, i) => (
          <Reveal key={event.id} delay={i * 100}>
            <div
              className={`border p-6 text-start ${radiusClass(theme.cardRadius)}`}
              style={{ backgroundColor: "var(--inv-surface)", borderColor: "var(--inv-primary)", opacity: 0.97 }}
            >
              <p
                className="text-lg font-bold"
                style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
              >
                {event.name}
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm" style={{ color: "var(--inv-text-muted)" }}>
                {event.date && (
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0" style={{ color: "var(--inv-primary)" }} />
                    {formatDate(event.date, locale)}
                  </span>
                )}
                {event.time && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" style={{ color: "var(--inv-primary)" }} />
                    {event.time}
                  </span>
                )}
                {event.locationName && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--inv-primary)" }} />
                    {event.locationName}
                  </span>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
