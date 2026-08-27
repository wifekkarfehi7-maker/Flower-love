"use client";

import { Reveal } from "@/components/ui/reveal";
import { Divider } from "../divider";
import { radiusClass } from "../theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const TITLES = { ar: "قواعد الحفلة", fr: "Règles de la fête", en: "Party rules" };

export function RulesSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  if (!invitation.partyRules || invitation.partyRules.length === 0) return null;

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

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
        {invitation.partyRules.map((rule, i) => (
          <Reveal key={i} delay={i * 80}>
            <div
              className={`border px-5 py-3 text-sm ${radiusClass(theme.cardRadius)}`}
              style={{
                backgroundColor: "var(--inv-surface)",
                borderColor: "var(--inv-primary)",
                opacity: 0.97,
                color: "var(--inv-text)",
              }}
            >
              {rule}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
