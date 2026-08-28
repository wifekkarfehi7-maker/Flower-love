"use client";

import type { CSSProperties } from "react";

import { MotifIcon } from "../motif-icon";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TemplateTheme } from "@/types/invitation";

const TAP_LABEL = { ar: "دُسّوا لفتح الدعوة", fr: "Touchez pour ouvrir", en: "Tap to open" };

/** A wax-seal envelope flap that lifts away on open. */
export function EnvelopeOverlay({
  theme,
  isOpen,
  onOpen,
}: {
  theme: TemplateTheme;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const { locale } = useTranslation();

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={isOpen}
      aria-label={TAP_LABEL[locale]}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500"
      style={{
        backgroundColor: theme.surface,
        backgroundImage: `radial-gradient(${theme.primary}2e 1.5px, transparent 1.5px)`,
        backgroundSize: "18px 18px",
        cursor: isOpen ? "default" : "pointer",
        opacity: isOpen ? 0 : 1,
        pointerEvents: isOpen ? "none" : "auto",
        transitionDelay: isOpen ? "700ms" : "0ms",
      }}
    >
      {/* top flap — hinges open like a real envelope lid, with a fold-line sheen and a shadow that lifts off the page */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[58%] transition-[transform,opacity,box-shadow] duration-[900ms] ease-[cubic-bezier(0.6,0.05,0.3,1)]"
        style={{
          backgroundColor: theme.primary,
          backgroundImage: `linear-gradient(165deg, ${theme.accent}40 0%, transparent 45%, rgba(0,0,0,0.12) 100%)`,
          clipPath: "polygon(0 0, 100% 0, 50% 78%)",
          transformOrigin: "top center",
          transform: isOpen ? "perspective(700px) rotateX(-148deg) translateY(-2%)" : "perspective(700px) rotateX(0deg)",
          boxShadow: isOpen ? "none" : "0 12px 20px -8px rgba(0,0,0,0.4)",
          opacity: isOpen ? 0 : 1,
        }}
      />

      {/* wax seal — organic blob edge instead of a perfect circle, with a slow "breathe" to invite the tap */}
      <span
        className="relative z-10 flex h-16 w-16 items-center justify-center transition-all duration-700"
        style={{
          borderRadius: "46% 54% 51% 49% / 55% 47% 53% 45%",
          backgroundImage: `radial-gradient(circle at 32% 26%, ${theme.accent}, ${theme.primary} 72%)`,
          boxShadow: `inset 0 -3px 5px rgba(0,0,0,0.35), inset 0 2px 3px rgba(255,255,255,0.3), 0 4px 10px rgba(0,0,0,0.35)`,
          border: `1px solid ${theme.primary}`,
          transform: isOpen ? "scale(0.4) rotate(35deg)" : "scale(1) rotate(0deg)",
          opacity: isOpen ? 0 : 1,
          animation: isOpen ? undefined : "seal-breathe 3.2s ease-in-out infinite",
        }}
      >
        <MotifIcon motif={theme.motif} className="h-7 w-7" style={{ color: theme.background, opacity: 0.9 }} />
      </span>

      <span
        className="relative z-10 mt-4 text-xs font-medium tracking-wide transition-opacity duration-500"
        style={{ color: theme.text, opacity: isOpen ? 0 : 0.75 }}
      >
        {TAP_LABEL[locale]}
      </span>
    </button>
  );
}

/** Two panels that part like curtains on open. */
export function CurtainOverlay({
  theme,
  isOpen,
  onOpen,
}: {
  theme: TemplateTheme;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const { locale } = useTranslation();

  const panelStyle = (side: "left" | "right"): CSSProperties => ({
    backgroundColor: theme.primary,
    backgroundImage: `repeating-linear-gradient(90deg, ${theme.background}22 0px, transparent 2px 22px), linear-gradient(115deg, transparent 20%, ${theme.accent}33 45%, transparent 70%)`,
    backgroundSize: "auto, 250% 100%",
    transitionProperty: "transform, opacity",
    transitionDuration: "850ms",
    transitionTimingFunction: "cubic-bezier(0.65,0,0.35,1)",
    transform: isOpen ? `translateX(${side === "left" ? "-105%" : "105%"})` : "translateX(0)",
    animation: isOpen ? undefined : "shimmer 5s ease-in-out infinite",
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={isOpen}
      aria-label={TAP_LABEL[locale]}
      className="absolute inset-0 z-20"
      style={{ cursor: isOpen ? "default" : "pointer", pointerEvents: isOpen ? "none" : "auto" }}
    >
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1/2" style={panelStyle("left")} />
      <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/2" style={panelStyle("right")} />

      <span
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 transition-opacity duration-300"
        style={{ opacity: isOpen ? 0 : 1 }}
      >
        <MotifIcon motif={theme.motif} className="h-7 w-7" style={{ color: theme.accent }} />
        <span className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>
          {TAP_LABEL[locale]}
        </span>
      </span>
    </button>
  );
}
