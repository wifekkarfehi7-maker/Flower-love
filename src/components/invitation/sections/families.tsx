"use client";

import type * as React from "react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const STRINGS = {
  ar: { title: "العائلتان", eyebrow: "بمباركة", son: "نجل", daughter: "كريمة", mr: "السيد", miss: "الآنسة" },
  fr: { title: "Les familles", eyebrow: "Avec la bénédiction de", son: "Fils de", daughter: "Fille de", mr: "M.", miss: "Mlle" },
  en: { title: "The Families", eyebrow: "With the blessing of", son: "Son of", daughter: "Daughter of", mr: "Mr.", miss: "Miss" },
};

/** One side of the couple: the groom or bride by name, then the parents' names under it. */
function Parent({ name, father, mother }: { name: React.ReactNode; father?: string; mother?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[1.2rem]" style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-primary)" }}>
        {name}
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

  // "السيد أحمد" / "الآنسة سيرين"; without a first name, fall back to "نجل" / "كريمة".
  // The name sits in <bdi> so an Arabic name after "M." keeps its place in a left-to-right page.
  const groom = invitation.groomName ? <>{t.mr} <bdi>{invitation.groomName}</bdi></> : t.son;
  const bride = invitation.brideName ? <>{t.miss} <bdi>{invitation.brideName}</bdi></> : t.daughter;

  return (
    <SectionShell>
      <SectionHeading title={t.title} eyebrow={t.eyebrow} theme={theme} />

      <Reveal delay={120}>
        <div className="mt-12 flex flex-col items-center gap-9">
          <Parent name={groom} father={invitation.groomFather} mother={invitation.groomMother} />
          <span
            aria-hidden="true"
            className="block h-8 w-px"
            style={{ backgroundColor: "var(--inv-primary)", opacity: 0.3 }}
          />
          <Parent name={bride} father={invitation.brideFather} mother={invitation.brideMother} />
        </div>
      </Reveal>
    </SectionShell>
  );
}
