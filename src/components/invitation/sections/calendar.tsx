"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionShell } from "../section-heading";
import { buttonClass } from "../theme";
import { MONTHS, WEEKDAYS, WEEKDAYS_SHORT, formatDateParts } from "../date-parts";
import { downloadIcsEvent } from "@/lib/ics";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: { eyebrow: "احفظوا التاريخ", cta: "أضيفوا الموعد لتقويمكم", weddingDay: "يوم الزفاف", caption: "تقويم شهر" },
  fr: { eyebrow: "Réservez la date", cta: "Ajouter à mon calendrier", weddingDay: "jour du mariage", caption: "Calendrier de" },
  en: { eyebrow: "Save the date", cta: "Add to my calendar", weddingDay: "wedding day", caption: "Calendar for" },
};

export function CalendarSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  const parts = formatDateParts(invitation.weddingDate, locale);
  if (!parts) return null;

  const { fullYear, monthIndex, dayOfMonth } = parts;
  // Date.UTC keeps the grid identical on a UTC server and a UTC+1 phone.
  const firstWeekday = new Date(Date.UTC(fullYear, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(fullYear, monthIndex + 1, 0)).getUTCDate();

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const monthLabel = `${MONTHS[locale][monthIndex]} ${fullYear}`;

  return (
    <SectionShell>
      <Reveal className="flex flex-col items-center">
        <span
          className="text-[0.55rem] uppercase"
          style={{ color: "var(--inv-primary)", letterSpacing: "var(--inv-track-wide, 0.4em)", fontFamily: "var(--inv-font-body)", opacity: 0.8 }}
        >
          {t.eyebrow}
        </span>
        <p
          className="mt-4 text-[1.4rem]"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)", letterSpacing: "0.08em" }}
        >
          {monthLabel}
        </p>
      </Reveal>

      <Reveal delay={110} className="mt-9">
        <table className="w-full border-collapse" style={{ fontFamily: "var(--inv-font-body)" }}>
          <caption className="sr-only">{`${t.caption} ${monthLabel}`}</caption>
          <thead>
            <tr>
              {WEEKDAYS_SHORT[locale].map((short, i) => (
                <th
                  key={short}
                  scope="col"
                  className="pb-3 text-[0.5rem] font-normal uppercase"
                  style={{
                    color: "var(--inv-primary)",
                    letterSpacing: "var(--inv-track-label, 0.34em)",
                    opacity: 0.75,
                    borderBottom: "1px solid var(--inv-primary)",
                  }}
                >
                  <abbr title={WEEKDAYS[locale][i]} className="no-underline">
                    {short}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, w) => (
              <tr key={w}>
                {week.map((d, i) => {
                  const isWeddingDay = d === dayOfMonth;
                  return (
                    <td
                      key={i}
                      className="p-0 text-center align-middle"
                      {...(isWeddingDay ? { "aria-current": "date" as const } : {})}
                    >
                      {d && (
                        <span
                          className={cn(
                            "inv-figures mx-auto my-1 flex h-8 w-8 items-center justify-center text-[0.8rem]",
                            isWeddingDay && "rounded-full"
                          )}
                          style={
                            isWeddingDay
                              ? { border: "1px solid var(--inv-primary)", color: "var(--inv-primary)" }
                              : { color: "var(--inv-text)", opacity: 0.55 }
                          }
                        >
                          {d}
                          {isWeddingDay && <span className="sr-only"> — {t.weddingDay}</span>}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <Reveal delay={200} className="mt-10 flex justify-center">
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
          className={buttonClass(theme.buttonStyle)}
          style={{ borderColor: "var(--inv-primary)", color: "var(--inv-primary)" }}
        >
          {t.cta}
        </button>
      </Reveal>
    </SectionShell>
  );
}
