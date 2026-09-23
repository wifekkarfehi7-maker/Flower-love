import type { CSSProperties } from "react";

import type { Locale } from "@/lib/i18n/config";
import type { CoverLayout, InvitationData, TemplateTheme } from "@/types/invitation";
import { formatDateParts, type DateParts } from "../date-parts";

const STRINGS = {
  ar: {
    masthead: "دعوة زفاف",
    eyebrow: "بمشيئة الله وبمباركة العائلتين",
    invite: "يسعدنا حضوركم للاحتفال بزفاف",
    and: "و",
    dateLabel: "التاريخ",
    venueLabel: "المكان",
    timeLabel: "الساعة",
  },
  fr: {
    masthead: "Faire-part de mariage",
    eyebrow: "Avec la bénédiction de leurs familles",
    invite: "Vous êtes conviés au mariage de",
    and: "&",
    dateLabel: "Date",
    venueLabel: "Lieu",
    timeLabel: "Heure",
  },
  en: {
    masthead: "Wedding invitation",
    eyebrow: "Together with their families",
    invite: "Invite you to celebrate the wedding of",
    and: "&",
    dateLabel: "Date",
    venueLabel: "Venue",
    timeLabel: "Time",
  },
};

/** Everything a cover composition may draw, resolved once by the dispatcher. */
export type CoverModel = {
  locale: Locale;
  t: (typeof STRINGS)["ar"];
  groom: string;
  bride: string;
  date: DateParts | null;
  /** The date as a folio line, e.g. 17.07.2027. */
  folio: string | null;
  time: string | null;
  venue: string | null;
  /** The couple's chosen cover photo, else their first gallery photo, else null (each layout designs that case). */
  image: string | null;
  theme: TemplateTheme;
};

export function buildCoverModel(invitation: InvitationData, theme: TemplateTheme, locale: Locale): CoverModel {
  const [y, m, d] = (invitation.weddingDate ?? "").split("-");
  const firstEvent = invitation.events[0];
  return {
    locale,
    t: STRINGS[locale],
    groom: invitation.groomName,
    bride: invitation.brideName,
    date: formatDateParts(invitation.weddingDate, locale),
    folio: y && m && d ? `${d}.${m}.${y}` : null,
    time: invitation.weddingTime ?? firstEvent?.time ?? null,
    venue: firstEvent?.locationName ?? null,
    image: invitation.coverImageUrl ?? invitation.gallery[0]?.url ?? null,
    theme,
  };
}

/** Stagger helper: a delay measured from the moment the invitation opens. */
export function at(ms: number): CSSProperties {
  return { ["--d" as string]: `calc(var(--cover-start, 0ms) + ${ms}ms)` } as CSSProperties;
}

export type { CoverLayout };
