import type { CSSProperties } from "react";

import type { TemplateFonts, TemplateTheme } from "@/types/invitation";

const FONT_FAMILY_MAP: Record<string, string> = {
  amiri: "var(--font-amiri), serif",
  playfair: "var(--font-playfair), serif",
  inter: "var(--font-inter), sans-serif",
  cairo: "var(--font-cairo), sans-serif",
  cormorant: "var(--font-cormorant), Georgia, serif",
  "cormorant-italic": "var(--font-cormorant), Georgia, serif",
  cinzel: "var(--font-cinzel), Georgia, serif",
  pinyon: "var(--font-pinyon), cursive",
  naskh: "var(--font-naskh), serif",
  kufi: "var(--font-kufi), sans-serif",
};

export function fontFamilyFor(font: string): string {
  return FONT_FAMILY_MAP[font] ?? FONT_FAMILY_MAP.cormorant!;
}

/** CSS custom properties applied to the invitation root so every section can reference the theme without prop drilling. */
export function themeCssVars(theme: TemplateTheme, fonts: TemplateFonts): CSSProperties {
  return {
    "--inv-bg": theme.background,
    "--inv-bg-alt": theme.backgroundAlt ?? theme.background,
    "--inv-surface": theme.surface,
    "--inv-primary": theme.primary,
    "--inv-accent": theme.accent,
    "--inv-text": theme.text,
    "--inv-text-muted": theme.textMuted ?? theme.text,
    "--inv-seal": theme.sealColor ?? theme.primary,
    "--inv-font-heading": fontFamilyFor(fonts.heading),
    "--inv-font-body": fontFamilyFor(fonts.body),
    "--inv-font-display": fontFamilyFor(fonts.display ?? fonts.heading),
    "--inv-display-style": fonts.display === "cormorant-italic" ? "italic" : "normal",
  } as CSSProperties;
}

export function sectionBackground(theme: TemplateTheme): CSSProperties {
  switch (theme.backgroundStyle) {
    case "gradient":
      return { backgroundImage: `linear-gradient(168deg, var(--inv-bg) 0%, var(--inv-surface) 62%, var(--inv-bg) 100%)` };
    case "radial":
      return { backgroundImage: `radial-gradient(ellipse 90% 60% at 50% 12%, var(--inv-surface) 0%, var(--inv-bg) 70%)` };
    case "pattern":
      return {
        backgroundColor: theme.background,
        backgroundImage: `radial-gradient(${theme.primary}1f 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
      };
    default:
      return { backgroundColor: theme.background };
  }
}

/**
 * A near-invisible material overlay that keeps flat color from reading as
 * "web page". Kept under 5% opacity — it should register as tooth in the
 * paper, never as a visible pattern.
 */
export function textureLayer(texture: TemplateTheme["texture"], tint: string): CSSProperties | null {
  switch (texture) {
    case "paper":
      return {
        backgroundImage: `radial-gradient(${tint}0d 0.5px, transparent 0.6px), radial-gradient(${tint}0a 0.5px, transparent 0.6px)`,
        backgroundSize: "3px 3px, 7px 7px",
        backgroundPosition: "0 0, 2px 3px",
      };
    case "linen":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${tint}0d 0px 1px, transparent 1px 4px), repeating-linear-gradient(0deg, ${tint}0a 0px 1px, transparent 1px 4px)`,
      };
    case "velvet":
      return {
        backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, ${tint}14, transparent 70%), repeating-linear-gradient(112deg, ${tint}08 0px 2px, transparent 2px 6px)`,
      };
    case "satin":
      return {
        backgroundImage: `repeating-linear-gradient(104deg, ${tint}00 0px, ${tint}0f 40px, ${tint}00 90px)`,
      };
    default:
      return null;
  }
}

export function radiusClass(radius: TemplateTheme["cardRadius"]): string {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "soft":
      return "rounded-md";
    case "round":
      return "rounded-[1.25rem]";
    case "ornate":
      return "rounded-[0.25rem]";
  }
}

/**
 * Invitation buttons are letterpress, not UI: a hairline rule, wide tracking,
 * and a whisper of movement on press. No fills, no shadows, no scale pops.
 */
export function buttonClass(style: TemplateTheme["buttonStyle"]): string {
  const base =
    "inline-flex items-center justify-center gap-2 border text-[0.7rem] font-medium uppercase tracking-[0.32em] transition-[background-color,color,letter-spacing] duration-500 active:scale-[0.99]";
  switch (style) {
    case "pill":
      return `${base} rounded-full px-9 py-3.5`;
    case "sharp":
      return `${base} rounded-none px-10 py-3.5`;
    case "outline-ornate":
      return `${base} rounded-[2px] px-10 py-4`;
  }
}

export function headingClass(theme: TemplateTheme): string {
  return theme.dividerStyle === "ornament" ? "tracking-wide" : "";
}
