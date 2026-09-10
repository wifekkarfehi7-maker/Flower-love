import type { CSSProperties } from "react";

import type { MenuTheme } from "@/types/database";

interface ThemePalette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  /** Applied to the sticky header behind a blur. */
  headerBg: string;
  radius: string;
  /** Themes that read better with a serif display face use the system stack. */
  display: "sans" | "serif";
}

const PALETTES: Record<MenuTheme, ThemePalette> = {
  classic: {
    bg: "#faf8f4",
    surface: "#ffffff",
    surfaceAlt: "#f3efe7",
    text: "#241f1a",
    muted: "#6f665b",
    border: "#e6dfd3",
    headerBg: "rgba(250, 248, 244, 0.92)",
    radius: "0.5rem",
    display: "serif",
  },
  modern: {
    bg: "#f7f8f9",
    surface: "#ffffff",
    surfaceAlt: "#eef1f3",
    text: "#101828",
    muted: "#667085",
    border: "#e4e7ec",
    headerBg: "rgba(247, 248, 249, 0.92)",
    radius: "1rem",
    display: "sans",
  },
  elegant: {
    bg: "#fbf9f6",
    surface: "#ffffff",
    surfaceAlt: "#f4efe8",
    text: "#1c1a17",
    muted: "#7a6f62",
    border: "#e8e0d4",
    headerBg: "rgba(251, 249, 246, 0.92)",
    radius: "0.25rem",
    display: "serif",
  },
  minimal: {
    bg: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#f5f5f5",
    text: "#171717",
    muted: "#737373",
    border: "#eaeaea",
    headerBg: "rgba(255, 255, 255, 0.94)",
    radius: "0.375rem",
    display: "sans",
  },
  dark: {
    bg: "#0f1115",
    surface: "#171a21",
    surfaceAlt: "#1f232c",
    text: "#f2f4f7",
    muted: "#98a2b3",
    border: "#272b34",
    headerBg: "rgba(15, 17, 21, 0.92)",
    radius: "1rem",
    display: "sans",
  },
  coffee: {
    bg: "#f7f1e9",
    surface: "#fffdfa",
    surfaceAlt: "#efe3d5",
    text: "#2b1d13",
    muted: "#7c6551",
    border: "#e3d3c0",
    headerBg: "rgba(247, 241, 233, 0.92)",
    radius: "0.75rem",
    display: "serif",
  },
  restaurant: {
    bg: "#f6f7f5",
    surface: "#ffffff",
    surfaceAlt: "#eaeee9",
    text: "#16201a",
    muted: "#5f6d63",
    border: "#dde3dd",
    headerBg: "rgba(246, 247, 245, 0.92)",
    radius: "0.75rem",
    display: "sans",
  },
};

function normalizeHex(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#0f766e";
}

/** Relative luminance (sRGB), used to keep text on brand colours readable. */
function luminance(hex: string) {
  const value = normalizeHex(hex).slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableOn(hex: string) {
  return luminance(hex) > 0.45 ? "#101828" : "#ffffff";
}

export function menuThemeStyle(theme: MenuTheme, primary: string, secondary: string): CSSProperties {
  const palette = PALETTES[theme] ?? PALETTES.modern;
  const accent = normalizeHex(primary);
  const accentAlt = normalizeHex(secondary);

  return {
    "--menu-bg": palette.bg,
    "--menu-surface": palette.surface,
    "--menu-surface-alt": palette.surfaceAlt,
    "--menu-text": palette.text,
    "--menu-muted": palette.muted,
    "--menu-border": palette.border,
    "--menu-header-bg": palette.headerBg,
    "--menu-radius": palette.radius,
    "--menu-accent": accent,
    "--menu-accent-text": readableOn(accent),
    "--menu-accent-alt": accentAlt,
    "--menu-accent-alt-text": readableOn(accentAlt),
  } as CSSProperties;
}

export function menuDisplayClass(theme: MenuTheme) {
  return (PALETTES[theme] ?? PALETTES.modern).display === "serif" ? "font-serif" : "font-sans";
}

export function isDarkTheme(theme: MenuTheme) {
  return theme === "dark";
}
