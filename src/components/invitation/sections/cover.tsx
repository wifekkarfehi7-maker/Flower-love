"use client";

import Image from "next/image";

import { useTranslation } from "@/lib/i18n/use-translation";
import { BotanicalCorner } from "../ornament";
import { FoilSweep, FrameBorder, TextureOverlay } from "../luxury";
import { OpeningExperience } from "../opening-experience";
import { formatDateParts } from "../date-parts";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

const STRINGS = {
  ar: { eyebrow: "بمشيئة الله وبمباركة العائلتين", invite: "يسعدنا حضوركم للاحتفال بزفاف", and: "و" },
  fr: { eyebrow: "Avec la bénédiction de leurs familles", invite: "Vous êtes conviés au mariage de", and: "&" },
  en: { eyebrow: "Together with their families", invite: "Invite you to celebrate the wedding of", and: "&" },
};

function initialsOf(a: string, b: string) {
  return `${(a.trim()[0] ?? "").toUpperCase()}${(b.trim()[0] ?? "").toUpperCase()}` || "&";
}

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
  const t = STRINGS[locale];
  const hasCoverImage = Boolean(invitation.coverImageUrl);
  const date = formatDateParts(invitation.weddingDate, locale);
  const nameColor = hasCoverImage ? "#ffffff" : "var(--inv-text)";
  const ruleColor = hasCoverImage ? "rgba(255,255,255,0.55)" : "var(--inv-primary)";

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden px-7 py-14 text-center">
      {hasCoverImage ? (
        <div aria-hidden="true" className="absolute inset-0">
          <Image src={invitation.coverImageUrl!} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/65" />
        </div>
      ) : (
        <TextureOverlay texture={theme.texture} tint={theme.primary} />
      )}

      {theme.frameStyle && theme.frameStyle !== "arch" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-5">
          <FrameBorder style={theme.frameStyle} color={ruleColor} />
        </div>
      )}
      {theme.frameStyle === "arch" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-0 top-8">
          <FrameBorder style="arch" color={ruleColor} />
        </div>
      )}

      {theme.decorativeStyle && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-9">
          <BotanicalCorner
            variant={theme.decorativeStyle}
            accent={theme.accent}
            className="absolute start-0 top-0 h-28 w-28"
            style={{ color: ruleColor, opacity: hasCoverImage ? 0.45 : 0.75 }}
          />
          <BotanicalCorner
            variant={theme.decorativeStyle}
            accent={theme.accent}
            className="absolute bottom-0 end-0 h-28 w-28 -scale-x-100 -scale-y-100"
            style={{ color: ruleColor, opacity: hasCoverImage ? 0.45 : 0.75 }}
          />
        </div>
      )}

      {/* The composition sits above centre — printed invitations leave the
          deeper margin at the foot of the card, never an even split. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-[14vh] pt-[6vh]">
        <p
          className="max-w-[19rem] text-[0.6rem] uppercase leading-relaxed"
          style={{
            color: hasCoverImage ? "rgba(255,255,255,0.78)" : "var(--inv-text-muted)",
            letterSpacing: "var(--inv-track-label, 0.34em)",
            fontFamily: "var(--inv-font-body)",
          }}
        >
          {t.eyebrow}
        </p>

        <span
          aria-hidden="true"
          className="relative mt-7 block h-px w-16 origin-center animate-rule-draw"
          style={{ backgroundColor: ruleColor, opacity: 0.6 }}
        >
          <FoilSweep enabled={theme.foil !== false} />
        </span>

        <p
          className="mt-9 text-[clamp(2.6rem,13vw,3.9rem)] leading-[1.06]"
          style={{
            fontFamily: "var(--inv-font-display)",
            fontStyle: "var(--inv-display-style)" as React.CSSProperties["fontStyle"],
            color: nameColor,
            fontWeight: 400,
          }}
        >
          {invitation.groomName}
        </p>

        <span
          className="my-2 block text-2xl"
          style={{ fontFamily: "var(--inv-font-display)", color: ruleColor, opacity: 0.85 }}
        >
          {t.and}
        </span>

        <p
          className="text-[clamp(2.6rem,13vw,3.9rem)] leading-[1.06]"
          style={{
            fontFamily: "var(--inv-font-display)",
            fontStyle: "var(--inv-display-style)" as React.CSSProperties["fontStyle"],
            color: nameColor,
            fontWeight: 400,
          }}
        >
          {invitation.brideName}
        </p>

        <p
          className="mt-9 max-w-[17rem] text-[0.58rem] uppercase leading-relaxed"
          style={{
            color: hasCoverImage ? "rgba(255,255,255,0.72)" : "var(--inv-text-muted)",
            letterSpacing: "var(--inv-track-label, 0.34em)",
            fontFamily: "var(--inv-font-body)",
          }}
        >
          {t.invite}
        </p>

        {date && (
          <div className="mt-8 flex items-center gap-5">
            <span aria-hidden="true" className="block h-px w-10" style={{ backgroundColor: ruleColor, opacity: 0.45 }} />
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="text-[0.58rem] uppercase"
                style={{ color: ruleColor, letterSpacing: "var(--inv-track-label, 0.34em)", fontFamily: "var(--inv-font-body)" }}
              >
                {date.weekday}
              </span>
              <span
                className="text-[2.15rem] leading-none"
                style={{ color: nameColor, fontFamily: "var(--inv-font-heading)", fontWeight: 400 }}
              >
                {date.day}
              </span>
              <span
                className="text-[0.58rem] uppercase"
                style={{ color: ruleColor, letterSpacing: "var(--inv-track-label, 0.34em)", fontFamily: "var(--inv-font-body)" }}
              >
                {date.month} {date.year}
              </span>
            </div>
            <span aria-hidden="true" className="block h-px w-10" style={{ backgroundColor: ruleColor, opacity: 0.45 }} />
          </div>
        )}
      </div>

      {isOpen && (
        <span
          aria-hidden="true"
          className="relative z-10 mx-auto block h-10 w-px"
          style={{
            backgroundImage: `linear-gradient(to bottom, transparent, ${ruleColor})`,
            opacity: 0.5,
          }}
        />
      )}

      <OpeningExperience
        theme={theme}
        isOpen={isOpen}
        onOpen={onOpen}
        monogram={initialsOf(invitation.groomName, invitation.brideName)}
      />
    </section>
  );
}
