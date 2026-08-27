import type { Locale } from "./config";

const AR_MONTHS_LONG = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/**
 * Locale-aware date formatting. Arabic output is built manually rather than
 * via `toLocaleDateString("ar-TN", ...)`: ICU embeds RTL directional marks
 * around the numeric groups in Arabic Gregorian dates, which garbles digit
 * ordering when rendered inside a mixed-direction layout (RTL page, LTR
 * numbers) — and the exact marks inserted can differ between the server's
 * ICU and the browser's, causing hydration mismatches too.
 */
export function formatShortDate(date: Date, locale: Locale): string {
  if (locale === "ar") {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  }
  return date.toLocaleDateString(locale);
}

export function formatLongDate(date: Date, locale: Locale): string {
  if (locale === "ar") {
    return `${date.getDate()} ${AR_MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

export function formatMonthYear(date: Date, locale: Locale): string {
  if (locale === "ar") {
    return `${AR_MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export function formatDateTime(date: Date, locale: Locale): string {
  if (locale === "ar") {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const period = hours < 12 ? "ص" : "م";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${formatShortDate(date, locale)} ${hour12}:${minutes} ${period}`;
  }
  return date.toLocaleString(locale);
}
