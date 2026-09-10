import type { Locale } from "./config";

interface CurrencyConfig {
  decimals: number;
  symbol: Record<Locale, string>;
}

/**
 * Currency rules live here rather than being scattered through the UI, so
 * adding a market means adding a row. TND is the Tunisian dinar: three
 * decimals (millimes), written "12.500 DT".
 */
const CURRENCIES: Record<string, CurrencyConfig> = {
  TND: { decimals: 3, symbol: { ar: "د.ت", fr: "DT", en: "DT" } },
  DZD: { decimals: 2, symbol: { ar: "د.ج", fr: "DA", en: "DA" } },
  MAD: { decimals: 2, symbol: { ar: "د.م", fr: "MAD", en: "MAD" } },
  EGP: { decimals: 2, symbol: { ar: "ج.م", fr: "EGP", en: "EGP" } },
  SAR: { decimals: 2, symbol: { ar: "ر.س", fr: "SAR", en: "SAR" } },
  AED: { decimals: 2, symbol: { ar: "د.إ", fr: "AED", en: "AED" } },
  EUR: { decimals: 2, symbol: { ar: "€", fr: "€", en: "€" } },
  USD: { decimals: 2, symbol: { ar: "$", fr: "$", en: "$" } },
};

export function currencySymbol(currency: string, locale: Locale) {
  return CURRENCIES[currency]?.symbol[locale] ?? currency;
}

export function currencyDecimals(currency: string) {
  return CURRENCIES[currency]?.decimals ?? 2;
}

/**
 * Formatted by hand rather than with Intl: the output has to be byte-identical
 * on the server and in the browser (Node and browser ICU data differ), and the
 * Tunisian convention is a dot decimal separator with a thin space for
 * thousands regardless of the interface language.
 */
export function formatPrice(
  amount: number | string | null | undefined,
  currency = "TND",
  locale: Locale = "ar",
  decimalsOverride?: number
) {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const decimals = decimalsOverride ?? currencyDecimals(currency);

  const fixed = Math.abs(safe).toFixed(decimals);
  const [integerPart = "0", fractionPart] = fixed.split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const number = fractionPart ? `${grouped}.${fractionPart}` : grouped;

  return `${safe < 0 ? "-" : ""}${number} ${currencySymbol(currency, locale)}`;
}

const DATE_LOCALES: Record<Locale, string> = {
  ar: "ar-TN",
  fr: "fr-TN",
  en: "en-GB",
};

export function formatDate(value: string | Date | null | undefined, locale: Locale = "ar") {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    numberingSystem: "latn",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined, locale: Locale = "ar") {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    numberingSystem: "latn",
    hour12: false,
  }).format(date);
}

export function formatNumber(value: number | null | undefined) {
  const safe = Number.isFinite(value ?? NaN) ? (value as number) : 0;
  return Math.round(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

type LocalizedRow<F extends string> = { [K in `${F}_ar` | `${F}_fr` | `${F}_en`]?: string | null };

/**
 * Picks a translated column with a graceful fallback chain — a venue that only
 * filled in French still shows something to an Arabic-speaking guest.
 */
export function localized<F extends string>(
  row: LocalizedRow<F> | null | undefined,
  field: F,
  locale: Locale,
  fallbackLocale?: Locale
): string {
  if (!row) return "";
  const order: Locale[] = [locale, ...(fallbackLocale ? [fallbackLocale] : []), "ar", "fr", "en"];
  for (const candidate of order) {
    const value = (row as Record<string, string | null | undefined>)[`${field}_${candidate}`];
    if (value && value.trim()) return value.trim();
  }
  return "";
}
