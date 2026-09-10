"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const STRINGS = {
  ar: { title: "بقي على الفرح", eyebrow: "العد التنازلي", days: "يوم", hours: "ساعة", minutes: "دقيقة", seconds: "ثانية", past: "اليوم الموعود" },
  fr: { title: "Plus que", eyebrow: "Compte à rebours", days: "Jours", hours: "Heures", minutes: "Minutes", seconds: "Secondes", past: "Le grand jour" },
  en: { title: "Counting Down", eyebrow: "Until we celebrate", days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds", past: "The Big Day" },
};

export function CountdownSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const countdown = useCountdown(invitation.weddingDate, invitation.weddingTime);

  if (countdown.isPast) {
    return (
      <SectionShell>
        <SectionHeading title={t.past} eyebrow={t.eyebrow} theme={theme} />
      </SectionShell>
    );
  }

  const units = [
    { key: "days", value: countdown.days, label: t.days },
    { key: "hours", value: countdown.hours, label: t.hours },
    { key: "minutes", value: countdown.minutes, label: t.minutes },
    { key: "seconds", value: countdown.seconds, label: t.seconds },
  ];

  const ornate = theme.countdownStyle === "ornate";
  const circular = theme.countdownStyle === "circular";

  return (
    <SectionShell>
      <SectionHeading title={t.title} eyebrow={t.eyebrow} theme={theme} />

      <Reveal delay={120}>
        <div className="mt-12 flex items-start justify-center gap-3">
          {units.map((u, i) => (
            <div key={u.key} className="flex items-start gap-3">
              {i > 0 && !circular && !ornate && (
                <span
                  aria-hidden="true"
                  className="mt-3 block h-8 w-px"
                  style={{ backgroundColor: "var(--inv-primary)", opacity: 0.22 }}
                />
              )}
              <div
                className="flex min-w-[3.6rem] flex-col items-center justify-center py-3"
                style={
                  ornate
                    ? { border: "1px solid var(--inv-primary)", minWidth: "4.1rem" }
                    : circular
                      ? {
                          border: "1px solid var(--inv-primary)",
                          borderRadius: "999px",
                          width: "4.2rem",
                          height: "4.2rem",
                        }
                      : undefined
                }
              >
                <span
                  className="text-[1.9rem] leading-none tabular-nums"
                  style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)", fontWeight: 400 }}
                >
                  {String(u.value).padStart(2, "0")}
                </span>
                <span
                  className="mt-2 text-[0.5rem] uppercase"
                  style={{ color: "var(--inv-text-muted)", letterSpacing: "0.24em" }}
                >
                  {u.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}
