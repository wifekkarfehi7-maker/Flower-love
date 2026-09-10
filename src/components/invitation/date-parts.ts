import type { Locale } from "@/lib/i18n/config";

/**
 * Month names follow Tunisian usage (جانفي / فيفري / أفريل / جوان / جويلية / أوت),
 * not the Levantine set a generic Arabic locale would produce. That's why the
 * invitation formats dates from raw parts instead of Intl.
 */
export const MONTHS: Record<Locale, string[]> = {
  ar: ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export const WEEKDAYS: Record<Locale, string[]> = {
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** Column headers for the month grid — the full name stays available to screen readers. */
export const WEEKDAYS_SHORT: Record<Locale, string[]> = {
  ar: ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
  fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export type DateParts = {
  weekday: string;
  day: string;
  month: string;
  year: string;
  /** Zero-based month index, for building a month grid. */
  monthIndex: number;
  dayOfMonth: number;
  fullYear: number;
};

/**
 * Built from the raw Y-M-D parts and resolved through Date.UTC, so a server in
 * UTC and a phone in Africa/Tunis never disagree about which day it is.
 */
export function formatDateParts(date: string | null, locale: Locale): DateParts | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  return {
    weekday: WEEKDAYS[locale][new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!,
    day: String(d).padStart(2, "0"),
    month: MONTHS[locale][m - 1]!,
    year: String(y),
    monthIndex: m - 1,
    dayOfMonth: d,
    fullYear: y,
  };
}
