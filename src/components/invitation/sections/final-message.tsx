import { Heart } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

export function FinalMessageSection({ invitation }: { invitation: InvitationData; theme: TemplateTheme }) {
  if (!invitation.finalMessage) return null;

  return (
    <section className="px-6 py-20 text-center">
      <Reveal className="flex flex-col items-center">
        <Heart className="h-6 w-6" style={{ color: "var(--inv-primary)" }} fill="var(--inv-primary)" />
        <p
          className="mx-auto mt-4 max-w-sm text-lg leading-relaxed"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
        >
          {invitation.finalMessage}
        </p>
        <p className="mt-6 text-sm opacity-60" style={{ color: "var(--inv-text)" }}>
          {invitation.groomName} &amp; {invitation.brideName}
        </p>
      </Reveal>
    </section>
  );
}
