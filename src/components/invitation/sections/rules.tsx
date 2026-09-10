"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const STRINGS = {
  ar: { title: "قواعد الحفلة", eyebrow: "ملاحظات لضيوفنا" },
  fr: { title: "Règles de la fête", eyebrow: "Notes pour nos invités" },
  en: { title: "Party Notes", eyebrow: "A few words for our guests" },
};

export function RulesSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  if (!invitation.partyRules || invitation.partyRules.length === 0) return null;

  return (
    <SectionShell>
      <SectionHeading title={t.title} eyebrow={t.eyebrow} theme={theme} />

      <div className="mt-11 flex flex-col items-center">
        {invitation.partyRules.map((rule, i) => (
          <Reveal key={rule} delay={i * 90} className="w-full">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="mx-auto mb-5 block h-px w-10"
                style={{ backgroundColor: "var(--inv-primary)", opacity: 0.25 }}
              />
            )}
            <p
              className="mb-5 text-[1rem] leading-relaxed"
              style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
            >
              {rule}
            </p>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
