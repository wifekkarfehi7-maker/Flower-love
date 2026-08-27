import { Reveal } from "@/components/ui/reveal";
import { Divider } from "../divider";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const TITLES = { ar: "العائلتان", fr: "Les familles", en: "The families" };

export function FamiliesSection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  if (!invitation.groomFather && !invitation.brideFather) return null;

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

        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-8">
          <div>
            <p className="text-sm opacity-60" style={{ color: "var(--inv-text)" }}>
              {invitation.groomName}
            </p>
            {invitation.groomFather && (
              <p className="mt-1 font-semibold" style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}>
                {invitation.groomFather}
              </p>
            )}
            {invitation.groomMother && (
              <p className="text-sm opacity-70" style={{ color: "var(--inv-text)" }}>
                {invitation.groomMother}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm opacity-60" style={{ color: "var(--inv-text)" }}>
              {invitation.brideName}
            </p>
            {invitation.brideFather && (
              <p className="mt-1 font-semibold" style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}>
                {invitation.brideFather}
              </p>
            )}
            {invitation.brideMother && (
              <p className="text-sm opacity-70" style={{ color: "var(--inv-text)" }}>
                {invitation.brideMother}
              </p>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
