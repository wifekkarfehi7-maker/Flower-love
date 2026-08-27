"use client";

import { Reveal } from "@/components/ui/reveal";
import { Divider } from "../divider";
import { radiusClass } from "../theme";
import { downloadIcsEvent } from "@/lib/ics";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatMonthYear } from "@/lib/i18n/format-date";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const WEEKDAYS = {
  ar: ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
  fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const ADD_TO_CALENDAR = { ar: "أضف إلى التقويم", fr: "Ajouter au calendrier", en: "Add to calendar" };

export function CalendarSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  if (!invitation.weddingDate) return null;

  const date = new Date(`${invitation.weddingDate}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = formatMonthYear(date, locale);

  return (
    <section className="px-6 py-16 text-center">
      <Reveal className="mx-auto max-w-xs">
        <p
          className="text-xl font-bold capitalize"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
        >
          {monthLabel}
        </p>
        <Divider theme={theme} />

        <div
          className={`mt-4 grid grid-cols-7 gap-y-2 border p-4 ${radiusClass(theme.cardRadius)}`}
          style={{ backgroundColor: "var(--inv-surface)", borderColor: "var(--inv-primary)", opacity: 0.97 }}
        >
          {WEEKDAYS[locale].map((wd) => (
            <span key={wd} className="text-[10px] font-medium opacity-60" style={{ color: "var(--inv-text)" }}>
              {wd}
            </span>
          ))}
          {cells.map((d, i) => (
            <span key={i} className="flex items-center justify-center py-1">
              {d && (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                  style={
                    d === day
                      ? { backgroundColor: "var(--inv-primary)", color: theme.background, fontWeight: 700 }
                      : { color: "var(--inv-text)", opacity: 0.75 }
                  }
                >
                  {d}
                </span>
              )}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            downloadIcsEvent({
              title: `${invitation.groomName} & ${invitation.brideName}`,
              location: invitation.events[0]?.locationName ?? undefined,
              date: invitation.weddingDate!,
              startTime: invitation.weddingTime,
            })
          }
          className="mt-5 text-sm font-semibold underline-offset-4 hover:underline"
          style={{ color: "var(--inv-primary)" }}
        >
          {ADD_TO_CALENDAR[locale]}
        </button>
      </Reveal>
    </section>
  );
}
