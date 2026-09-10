"use client";

import * as React from "react";

import { FoilSweep, TextureOverlay, WaxSeal } from "./luxury";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TemplateTheme } from "@/types/invitation";

const OPEN_LABEL = { ar: "افتحوا الدعوة", fr: "Ouvrir l'invitation", en: "Open Invitation" };
const EYEBROW = { ar: "دعوة زفاف", fr: "Faire-part de mariage", en: "Wedding Invitation" };

/** The engraved line that sits above a seal, the way stationery is captioned. */
function Eyebrow({ theme, isOpen }: { theme: TemplateTheme; isOpen: boolean }) {
  const { locale } = useTranslation();
  return (
    <span
      className="text-[0.55rem] uppercase"
      style={{
        color: theme.primary,
        opacity: isOpen ? 0 : 0.72,
        letterSpacing: "0.42em",
        fontFamily: "var(--font-cinzel), var(--font-amiri), serif",
        transition: "opacity 400ms ease",
      }}
    >
      {EYEBROW[locale]}
    </span>
  );
}

/** The one shared control: a hairline-ruled label, never a filled button. */
function OpenControl({ theme, isOpen, delay = 0 }: { theme: TemplateTheme; isOpen: boolean; delay?: number }) {
  const { locale } = useTranslation();
  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden border px-8 py-3 text-[0.62rem] font-medium uppercase"
      style={{
        borderColor: `${theme.primary}66`,
        color: theme.primary,
        letterSpacing: "0.34em",
        fontFamily: "var(--font-cinzel), serif",
        opacity: isOpen ? 0 : 1,
        transform: isOpen ? "translateY(6px)" : "translateY(0)",
        transition: `opacity 500ms ease ${delay}ms, transform 500ms ease ${delay}ms`,
      }}
    >
      <span className="relative">{OPEN_LABEL[locale]}</span>
      <FoilSweep enabled={theme.foil !== false} delay={900} />
    </span>
  );
}

type OpeningProps = {
  theme: TemplateTheme;
  isOpen: boolean;
  onOpen: () => void;
  monogram: string;
};

/** The full-bleed pressable surface every opening style sits on. */
function OpeningShell({
  theme,
  isOpen,
  onOpen,
  children,
  background,
  fadeDelay = 1150,
}: OpeningProps & { children: React.ReactNode; background?: React.CSSProperties; fadeDelay?: number }) {
  const { locale } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={isOpen}
      aria-label={OPEN_LABEL[locale]}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: theme.background,
        cursor: isOpen ? "default" : "pointer",
        pointerEvents: isOpen ? "none" : "auto",
        opacity: isOpen ? 0 : 1,
        transition: `opacity 700ms cubic-bezier(0.4,0,0.2,1) ${isOpen ? fadeDelay : 0}ms`,
        ...background,
      }}
    >
      <TextureOverlay texture={theme.texture} tint={theme.primary} />
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   1. Envelope — a real envelope: pocket, card, flap, wax seal, ribbon.
   ───────────────────────────────────────────────────────────────────────── */
function EnvelopeOpening(props: OpeningProps) {
  const { theme, isOpen, monogram } = props;
  const seal = theme.sealColor ?? theme.primary;
  const ease = "cubic-bezier(0.32, 0.72, 0.24, 1)";
  /* Envelope stock has to sit clearly off the page behind it, in both
     dark and light directions — lift the surface toward the ink colour. */
  const paper = `color-mix(in srgb, ${theme.surface} 86%, ${theme.primary} 14%)`;
  const rule = `${theme.primary}80`;

  return (
    <OpeningShell {...props} background={{ backgroundImage: `radial-gradient(ellipse 80% 55% at 50% 42%, ${theme.background}, color-mix(in srgb, ${theme.background} 86%, #000000) 82%)` }}>
      <div className="relative w-[76vw] max-w-[330px]" style={{ aspectRatio: "1.45 / 1", perspective: "1400px" }}>
        {/* the card, rising out of the pocket */}
        <div
          aria-hidden="true"
          className="absolute inset-x-[6%] bottom-[8%] top-[10%] border"
          style={{
            backgroundColor: theme.accent,
            borderColor: `${theme.primary}55`,
            transform: isOpen ? "translateY(-58%) scale(1.06)" : "translateY(0) scale(1)",
            opacity: isOpen ? 0 : 1,
            transition: `transform 1100ms ${ease} 620ms, opacity 500ms ease 1150ms`,
            boxShadow: "0 10px 24px -12px rgba(0,0,0,0.45)",
          }}
        >
          <div
            className="absolute inset-[10%] border"
            style={{ borderColor: `${theme.primary}44`, borderWidth: "0.5px" }}
          />
        </div>

        {/* envelope back wall */}
        <div
          aria-hidden="true"
          className="absolute inset-0 border"
          style={{
            backgroundColor: paper,
            borderColor: rule,
            backgroundImage: `linear-gradient(160deg, ${theme.primary}14, transparent 55%)`,
            zIndex: -1,
          }}
        />

        {/* front pocket — the two folded side panels and the bottom panel */}
        <div
          aria-hidden="true"
          className="absolute inset-0 border"
          style={{
            backgroundColor: paper,
            borderColor: rule,
            clipPath: "polygon(0 0, 50% 46%, 100% 0, 100% 100%, 0 100%)",
            backgroundImage: `linear-gradient(200deg, ${theme.primary}12, transparent 45%), linear-gradient(160deg, transparent 55%, rgba(0,0,0,0.16))`,
            opacity: isOpen ? 0 : 1,
            transition: "opacity 500ms ease 1100ms",
          }}
        />
        {/* creases where the panels meet */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 69"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          style={{ opacity: isOpen ? 0 : 0.55, transition: "opacity 400ms ease 1100ms" }}
        >
          <path d="M0 0 L50 32 L100 0" stroke={theme.primary} strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" opacity="0.5" />
          <path d="M0 69 L50 32 L100 69" stroke={theme.primary} strokeWidth="0.3" fill="none" vectorEffect="non-scaling-stroke" opacity="0.3" />
        </svg>

        {/* flap */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[52%]"
          style={{
            backgroundColor: `color-mix(in srgb, ${paper} 92%, #ffffff 8%)`,
            backgroundImage: `linear-gradient(170deg, ${theme.primary}22 0%, transparent 44%, rgba(0,0,0,0.18) 100%)`,
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformOrigin: "top center",
            backfaceVisibility: "hidden",
            transform: isOpen ? "rotateX(-158deg)" : "rotateX(0deg)",
            transition: `transform 1000ms ${ease} 220ms`,
            boxShadow: isOpen ? "none" : "0 14px 22px -14px rgba(0,0,0,0.55)",
          }}
        />

        {/* wax seal at the flap point */}
        <span
          className="absolute left-1/2 top-[52%] z-10"
          style={{
            transform: "translate(-50%, -50%)",
            transition: "opacity 400ms ease",
          }}
        >
          <WaxSeal color={seal} monogram={monogram} size={62} broken={isOpen} idle={!isOpen} />
        </span>
      </div>

      <span className="relative mt-12 flex flex-col items-center gap-6">
        <Eyebrow theme={theme} isOpen={isOpen} />
        <OpenControl theme={theme} isOpen={isOpen} />
      </span>
    </OpeningShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   2. Curtain — two satin panels drawing apart.
   ───────────────────────────────────────────────────────────────────────── */
function CurtainOpening(props: OpeningProps) {
  const { theme, isOpen, monogram } = props;
  const ease = "cubic-bezier(0.36, 0.06, 0.16, 1)";

  const panel = (side: "left" | "right"): React.CSSProperties => ({
    backgroundColor: theme.surface,
    backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.16) 0px, transparent 3px 26px, rgba(255,255,255,0.05) 30px, transparent 34px 56px), linear-gradient(${side === "left" ? "96deg" : "84deg"}, ${theme.primary}22, transparent 60%)`,
    transform: isOpen ? `translateX(${side === "left" ? "-101%" : "101%"})` : "translateX(0)",
    transition: `transform 1500ms ${ease} 120ms`,
    boxShadow: side === "left" ? "8px 0 22px -10px rgba(0,0,0,0.6)" : "-8px 0 22px -10px rgba(0,0,0,0.6)",
  });

  return (
    <OpeningShell {...props} fadeDelay={1500}>
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1/2" style={panel("left")} />
      <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/2" style={panel("right")} />

      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[3%]"
        aria-hidden="true"
        style={{ backgroundColor: theme.primary, opacity: isOpen ? 0 : 0.85, transition: "opacity 600ms ease 900ms" }}
      />

      <span
        className="relative z-10 flex flex-col items-center gap-8"
        style={{ opacity: isOpen ? 0 : 1, transition: "opacity 400ms ease" }}
      >
        <Eyebrow theme={theme} isOpen={isOpen} />
        <WaxSeal color={theme.sealColor ?? theme.primary} monogram={monogram} size={66} broken={isOpen} idle={!isOpen} />
        <OpenControl theme={theme} isOpen={isOpen} />
      </span>
    </OpeningShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   3. Paper fold — a bi-fold card opening from the centre.
   ───────────────────────────────────────────────────────────────────────── */
function PaperFoldOpening(props: OpeningProps) {
  const { theme, isOpen, monogram } = props;
  const ease = "cubic-bezier(0.34, 0.68, 0.2, 1)";

  const leaf = (side: "left" | "right"): React.CSSProperties => ({
    backgroundColor: theme.surface,
    backgroundImage:
      side === "left"
        ? `linear-gradient(90deg, transparent 70%, rgba(0,0,0,0.2)), linear-gradient(160deg, ${theme.primary}14, transparent 50%)`
        : `linear-gradient(270deg, transparent 70%, rgba(0,0,0,0.2)), linear-gradient(200deg, ${theme.primary}14, transparent 50%)`,
    transformOrigin: side === "left" ? "left center" : "right center",
    transform: isOpen ? `rotateY(${side === "left" ? "" : "-"}105deg)` : "rotateY(0deg)",
    transition: `transform 1350ms ${ease} 200ms`,
    backfaceVisibility: "hidden",
  });

  return (
    <OpeningShell {...props} fadeDelay={1350}>
      <div className="absolute inset-0" style={{ perspective: "1500px", perspectiveOrigin: "50% 50%" }}>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1/2 border-r" style={{ ...leaf("left"), borderColor: `${theme.primary}33` }} />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/2 border-l" style={{ ...leaf("right"), borderColor: `${theme.primary}33` }} />
      </div>

      <span
        className="relative z-10 flex flex-col items-center gap-9"
        style={{ opacity: isOpen ? 0 : 1, transition: "opacity 350ms ease" }}
      >
        <Eyebrow theme={theme} isOpen={isOpen} />
        <span className="relative block h-px w-24" style={{ backgroundColor: `${theme.primary}66` }}>
          <FoilSweep enabled={theme.foil !== false} />
        </span>
        <WaxSeal color={theme.sealColor ?? theme.primary} monogram={monogram} size={60} broken={isOpen} idle={!isOpen} />
        <OpenControl theme={theme} isOpen={isOpen} />
      </span>
    </OpeningShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   4. Wax seal — a sealed sheet that lifts once the seal gives way.
   ───────────────────────────────────────────────────────────────────────── */
function WaxSealOpening(props: OpeningProps) {
  const { theme, isOpen, monogram } = props;

  return (
    <OpeningShell
      {...props}
      fadeDelay={900}
      background={{
        backgroundImage: `linear-gradient(172deg, ${theme.surface} 0%, ${theme.background} 70%)`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-[7%] border"
        style={{
          borderColor: `${theme.primary}3d`,
          transform: isOpen ? "translateY(-3%) scale(1.02)" : "none",
          opacity: isOpen ? 0 : 1,
          transition: "transform 1000ms cubic-bezier(0.32,0.72,0.24,1) 400ms, opacity 700ms ease 500ms",
        }}
      >
        <div className="absolute inset-[3%] border" style={{ borderColor: `${theme.primary}26`, borderWidth: "0.5px" }} />
      </div>

      <span className="relative z-10 flex flex-col items-center">
        <Eyebrow theme={theme} isOpen={isOpen} />
        <span
          aria-hidden="true"
          className="relative mt-6 mb-11 block h-px w-20"
          style={{ backgroundColor: `${theme.primary}59`, opacity: isOpen ? 0 : 1, transition: "opacity 400ms ease" }}
        >
          <FoilSweep enabled={theme.foil !== false} />
        </span>
        <WaxSeal color={theme.sealColor ?? theme.primary} monogram={monogram} size={84} broken={isOpen} idle={!isOpen} />
        <span className="mt-12">
          <OpenControl theme={theme} isOpen={isOpen} />
        </span>
      </span>
    </OpeningShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   5. Minimal fade — a rule, a monogram, and light. Nothing moves but light.
   ───────────────────────────────────────────────────────────────────────── */
function MinimalFadeOpening(props: OpeningProps) {
  const { theme, isOpen, monogram } = props;

  return (
    <OpeningShell {...props} fadeDelay={500}>
      <span
        className="relative z-10 flex flex-col items-center"
        style={{
          opacity: isOpen ? 0 : 1,
          transform: isOpen ? "translateY(-10px)" : "none",
          transition: "opacity 620ms ease, transform 900ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <span
          className="relative block text-5xl"
          style={{
            fontFamily: "var(--font-cinzel), serif",
            color: theme.primary,
            letterSpacing: "0.12em",
          }}
        >
          {monogram}
          <FoilSweep enabled={theme.foil !== false} />
        </span>
        <span className="relative mt-7 block h-px w-40" style={{ backgroundColor: `${theme.primary}59` }}>
          <FoilSweep enabled={theme.foil !== false} delay={600} />
        </span>
        <span className="mt-12">
          <OpenControl theme={theme} isOpen={isOpen} />
        </span>
      </span>
    </OpeningShell>
  );
}

const OPENINGS = {
  envelope: EnvelopeOpening,
  curtain: CurtainOpening,
  "paper-fold": PaperFoldOpening,
  "wax-seal": WaxSealOpening,
  "minimal-fade": MinimalFadeOpening,
} as const;

/** Picks the opening choreography the template asks for. `classic` renders nothing. */
export function OpeningExperience(props: OpeningProps) {
  const style = props.theme.openAnimation;
  if (!style || style === "classic") return null;
  const Opening = OPENINGS[style];
  return <Opening {...props} />;
}
