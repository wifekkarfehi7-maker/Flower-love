import type { CSSProperties } from "react";

import type { TemplateFonts, TemplateTheme } from "@/types/invitation";

const FONT_FAMILY_MAP: Record<string, string> = {
  amiri: "var(--font-amiri), serif",
  playfair: "var(--font-playfair), serif",
  inter: "var(--font-inter), sans-serif",
  cairo: "var(--font-cairo), sans-serif",
};

export function fontFamilyFor(font: string): string {
  return FONT_FAMILY_MAP[font] ?? FONT_FAMILY_MAP.cairo!;
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
    "--inv-font-heading": fontFamilyFor(fonts.heading),
    "--inv-font-body": fontFamilyFor(fonts.body),
  } as CSSProperties;
}

export function sectionBackground(theme: TemplateTheme): CSSProperties {
  switch (theme.backgroundStyle) {
    case "gradient":
      return { backgroundImage: `linear-gradient(165deg, var(--inv-bg) 0%, var(--inv-surface) 100%)` };
    case "radial":
      return { backgroundImage: `radial-gradient(circle at 50% 0%, var(--inv-surface) 0%, var(--inv-bg) 72%)` };
    case "pattern":
      return {
        backgroundColor: theme.background,
        backgroundImage: `radial-gradient(${theme.accent}33 1.5px, transparent 1.5px)`,
        backgroundSize: "20px 20px",
      };
    default:
      return { backgroundColor: theme.background };
  }
}

export function radiusClass(radius: TemplateTheme["cardRadius"]): string {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "soft":
      return "rounded-xl";
    case "round":
      return "rounded-[2rem]";
    case "ornate":
      return "rounded-[2.5rem]";
  }
}

export function buttonClass(style: TemplateTheme["buttonStyle"]): string {
  switch (style) {
    case "pill":
      return "rounded-full px-8 py-3.5 font-semibold shadow-lg transition-transform hover:scale-[1.03]";
    case "sharp":
      return "rounded-none px-8 py-3.5 font-semibold uppercase tracking-[0.15em] text-sm transition-opacity hover:opacity-85";
    case "outline-ornate":
      return "rounded-full px-8 py-3.5 font-semibold border-2 shadow-lg transition-transform hover:scale-[1.03]";
  }
}

export function headingClass(theme: TemplateTheme): string {
  return theme.dividerStyle === "ornament" ? "tracking-wide" : "";
}
