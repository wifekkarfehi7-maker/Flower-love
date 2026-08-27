"use client";

import Image from "next/image";

import { useTranslation } from "@/lib/i18n/use-translation";
import { Reveal } from "@/components/ui/reveal";
import { MotifIcon } from "../motif-icon";
import { buttonClass } from "../theme";
import { EnvelopeOverlay, CurtainOverlay } from "./cover-open-overlay";
import type { InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

function formatDate(date: string | null, locale: "ar" | "fr" | "en") {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return locale === "en" ? `${month} / ${day} / ${year}` : `${day} / ${month} / ${year}`;
}

const OPEN_LABEL = { ar: "افتحوا الدعوة ❤️", fr: "Ouvrir l'invitation ❤️", en: "Open Invitation ❤️" };

export function CoverSection({
  invitation,
  theme,
  onOpen,
  isOpen,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  onOpen: () => void;
  isOpen: boolean;
}) {
  const { locale } = useTranslation();
  const hasCoverImage = Boolean(invitation.coverImageUrl);
  const nameColor = hasCoverImage ? "#ffffff" : "var(--inv-text)";

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      {hasCoverImage ? (
        <div aria-hidden="true" className="absolute inset-0">
          <Image src={invitation.coverImageUrl!} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/60" />
        </div>
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <MotifIcon motif={theme.motif} className="absolute -end-10 -top-10 h-64 w-64" style={{ color: "var(--inv-primary)" }} />
          <MotifIcon motif={theme.motif} className="absolute -bottom-16 -start-16 h-72 w-72" style={{ color: "var(--inv-primary)" }} />
        </div>
      )}

      {theme.openAnimation === "envelope" && <EnvelopeOverlay theme={theme} isOpen={isOpen} onOpen={onOpen} />}
      {theme.openAnimation === "curtain" && <CurtainOverlay theme={theme} isOpen={isOpen} onOpen={onOpen} />}

      <Reveal animation="scale-in" className="relative z-10 flex flex-col items-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full border"
          style={{ borderColor: "var(--inv-primary)", color: "var(--inv-primary)" }}
        >
          <MotifIcon motif={theme.motif} className="h-6 w-6" />
        </span>

        <p
          className="mt-8 text-4xl font-bold sm:text-5xl"
          style={{ fontFamily: "var(--inv-font-heading)", color: nameColor }}
        >
          {invitation.groomName}
        </p>
        <span className="my-3 text-2xl" style={{ color: "var(--inv-primary)" }}>
          &amp;
        </span>
        <p
          className="text-4xl font-bold sm:text-5xl"
          style={{ fontFamily: "var(--inv-font-heading)", color: nameColor }}
        >
          {invitation.brideName}
        </p>

        {invitation.weddingDate && (
          <p
            className="mt-8 text-lg tracking-[0.2em]"
            style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-primary)" }}
          >
            {formatDate(invitation.weddingDate, locale)}
          </p>
        )}

        {!isOpen && (
          <button
            type="button"
            onClick={onOpen}
            className={cn(buttonClass(theme.buttonStyle), "mt-10")}
            style={{
              backgroundColor: theme.buttonStyle === "outline-ornate" ? "transparent" : "var(--inv-primary)",
              borderColor: "var(--inv-primary)",
              color: theme.buttonStyle === "outline-ornate" ? "var(--inv-primary)" : theme.background,
            }}
          >
            {OPEN_LABEL[locale]}
          </button>
        )}
      </Reveal>
    </section>
  );
}
