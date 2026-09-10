"use client";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const STRINGS = {
  ar: { title: "العائلتان", eyebrow: "بمباركة", son: "نجل", daughter: "كريمة" },
  fr: { title: "Les familles", eyebrow: "Avec la bénédiction de", son: "Fils de", daughter: "Fille de" },
  en: { title: "The Families", eyebrow: "With the blessing of", son: "Son of", daughter: "Daughter of" },
};

function Parent({ relation, father, mother }: { relation: string; father?: string; mother?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="text-[0.52rem] uppercase"
        style={{ color: "var(--inv-primary)", letterSpacing: "0.34em", opacity: 0.85 }}
      >
        {relation}
      </span>
      {father && (
        <span className="text-[1.05rem]" style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}>
          {father}
        </span>
      )}
      {mother && (
        <span className="text-[0.95rem]" style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text-muted)" }}>
          {mother}
        </span>
      )}
    </div>
  );
}

export function FamiliesSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  if (!invitation.groomFather && !invitation.brideFather) return null;

  return (
    <SectionShell>
      <SectionHeading title={t.title} eyebrow={t.eyebrow} theme={theme} />

      <Reveal delay={120}>
        <div className="mt-12 flex flex-col items-center gap-9">
          <Parent relation={t.son} father={invitation.groomFather} mother={invitation.groomMother} />
          <span
            aria-hidden="true"
            className="block h-8 w-px"
            style={{ backgroundColor: "var(--inv-primary)", opacity: 0.3 }}
          />
          <Parent relation={t.daughter} father={invitation.brideFather} mother={invitation.brideMother} />
        </div>
      </Reveal>
    </SectionShell>
  );
}
