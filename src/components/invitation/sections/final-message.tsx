"use client";

import { Reveal } from "@/components/ui/reveal";
import { FoilSweep } from "../luxury";
import { SectionShell } from "../section-heading";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

export function FinalMessageSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  if (!invitation.finalMessage) return null;

  return (
    <SectionShell className="pb-28">
      <Reveal className="flex flex-col items-center">
        <p
          className="max-w-[22rem] text-[1.05rem] italic leading-[2]"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)", fontWeight: 400 }}
        >
          {invitation.finalMessage}
        </p>

        <span
          aria-hidden="true"
          className="relative mt-11 block h-px w-20"
          style={{ backgroundColor: "var(--inv-primary)", opacity: 0.45 }}
        >
          <FoilSweep enabled={theme.foil !== false} />
        </span>

        <p
          className="mt-9 text-[1.5rem]"
          style={{
            fontFamily: "var(--inv-font-display)",
            fontStyle: "var(--inv-display-style)" as React.CSSProperties["fontStyle"],
            color: "var(--inv-text)",
          }}
        >
          {invitation.groomName} &amp; {invitation.brideName}
        </p>
      </Reveal>
    </SectionShell>
  );
}
