import type { CSSProperties } from "react";

import type { Locale } from "@/lib/i18n/config";
import type { TemplateTheme } from "@/types/invitation";
import type { DateParts } from "../date-parts";

/** Kept out of the client stage module, so the server route can read it. */
export const PROTOTYPE_LAYOUTS = ["editorial", "arch", "midnight"] as const;
export type PrototypeLayout = (typeof PROTOTYPE_LAYOUTS)[number];

/** Everything a cover composition may draw, resolved once by the dispatcher. */
export type CoverModel = {
  locale: Locale;
  t: {
    masthead: string;
    eyebrow: string;
    invite: string;
    and: string;
    dateLabel: string;
    venueLabel: string;
    timeLabel: string;
  };
  groom: string;
  bride: string;
  date: DateParts | null;
  /** The date as a folio line, e.g. 17.07.2027. */
  folio: string | null;
  time: string | null;
  venue: string | null;
  /** coverImageUrl, else the layout's gallery pick, else null (typographic fallback). */
  image: string | null;
  theme: TemplateTheme;
};

/** Stagger helper: a delay measured from the moment the invitation opens. */
export function at(ms: number): CSSProperties {
  return { ["--d" as string]: `calc(var(--p2-start, 0ms) + ${ms}ms)` } as CSSProperties;
}
