import { Reveal } from "@/components/ui/reveal";
import { Divider } from "../divider";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

export function InvitationTextSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  if (!invitation.invitationText) return null;

  return (
    <section className="px-6 py-16 text-center">
      <Reveal>
        <p
          className="mx-auto max-w-md whitespace-pre-line text-xl leading-relaxed sm:text-2xl"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
        >
          {invitation.invitationText}
        </p>
        <Divider theme={theme} />
      </Reveal>
    </section>
  );
}
