"use client";

import { Reveal } from "@/components/ui/reveal";
import { OrnamentFlourish } from "../ornament";
import { SectionShell } from "../section-heading";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

export function InvitationTextSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  if (!invitation.invitationText) return null;

  return (
    <SectionShell>
      <Reveal className="flex flex-col items-center">
        {theme.dividerStyle !== "none" && (
          <span className="mb-10 block w-32" style={{ color: "var(--inv-primary)", opacity: 0.7 }}>
            <OrnamentFlourish className="h-4 w-full" />
          </span>
        )}
        <p
          className="whitespace-pre-line text-[1.18rem] leading-[2.1]"
          style={{
            fontFamily: "var(--inv-font-heading)",
            color: "var(--inv-text)",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          {invitation.invitationText}
        </p>
      </Reveal>
    </SectionShell>
  );
}
