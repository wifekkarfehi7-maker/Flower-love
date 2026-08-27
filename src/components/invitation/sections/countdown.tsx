"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Divider } from "../divider";
import { Reveal } from "@/components/ui/reveal";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const UNIT_LABELS_AR = { days: "يوم", hours: "ساعة", minutes: "دقيقة", seconds: "ثانية" };

export function CountdownSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const countdown = useCountdown(invitation.weddingDate, invitation.weddingTime);

  const unitLabel = (key: keyof typeof UNIT_LABELS_AR) => {
    if (locale === "ar") return UNIT_LABELS_AR[key];
    return key;
  };

  if (countdown.isPast) {
    return (
      <section className="px-6 py-16 text-center" style={{ color: "var(--inv-text)" }}>
        <p className="text-2xl font-bold" style={{ fontFamily: "var(--inv-font-heading)" }}>
          {locale === "ar" ? "اليوم الموعود ❤️" : "The Big Day ❤️"}
        </p>
      </section>
    );
  }

  const units: { key: keyof typeof UNIT_LABELS_AR; value: number }[] = [
    { key: "days", value: countdown.days },
    { key: "hours", value: countdown.hours },
    { key: "minutes", value: countdown.minutes },
    { key: "seconds", value: countdown.seconds },
  ];

  return (
    <section className="px-6 py-16 text-center">
      <Reveal>
        <Divider theme={theme} />
        {theme.countdownStyle === "circular" ? (
          <div className="mt-6 flex justify-center gap-4">
            {units.map((u) => (
              <div
                key={u.key}
                className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 sm:h-24 sm:w-24"
                style={{ borderColor: "var(--inv-primary)", color: "var(--inv-text)" }}
              >
                <span className="text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--inv-font-heading)" }}>
                  {u.value}
                </span>
                <span className="text-[10px] opacity-70">{unitLabel(u.key)}</span>
              </div>
            ))}
          </div>
        ) : theme.countdownStyle === "ornate" ? (
          <div className="mt-6 flex justify-center gap-3">
            {units.map((u) => (
              <div
                key={u.key}
                className="relative flex w-20 flex-col items-center justify-center border py-4 sm:w-24"
                style={{ borderColor: "var(--inv-primary)", color: "var(--inv-text)", backgroundColor: "var(--inv-surface)" }}
              >
                <span
                  className="pointer-events-none absolute inset-1 border"
                  style={{ borderColor: "var(--inv-accent)", opacity: 0.4 }}
                  aria-hidden="true"
                />
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--inv-font-heading)" }}>
                  {u.value}
                </span>
                <span className="mt-1 text-[10px] opacity-70">{unitLabel(u.key)}</span>
              </div>
            ))}
          </div>
        ) : theme.countdownStyle === "minimal" ? (
          <div className="mt-6 flex justify-center gap-6 sm:gap-10" style={{ color: "var(--inv-text)" }}>
            {units.map((u) => (
              <div key={u.key} className="text-center">
                <span className="block text-3xl font-light sm:text-4xl" style={{ fontFamily: "var(--inv-font-heading)" }}>
                  {u.value}
                </span>
                <span className="mt-1 block text-[11px] uppercase tracking-widest opacity-60">{unitLabel(u.key)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex justify-center gap-3">
            {units.map((u) => (
              <div
                key={u.key}
                className="flex w-20 flex-col items-center justify-center rounded-2xl py-4 shadow-md sm:w-24"
                style={{ backgroundColor: "var(--inv-surface)", color: "var(--inv-text)" }}
              >
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--inv-font-heading)" }}>
                  {u.value}
                </span>
                <span className="mt-1 text-[10px] opacity-70">{unitLabel(u.key)}</span>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
