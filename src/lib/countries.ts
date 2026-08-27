export interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: { ar: string; fr: string; en: string };
}

/**
 * Tunisia first/default throughout — this platform's primary market.
 * `dialCode` powers the WhatsApp number input's country-code selector;
 * `code`/`name` power the residence "Country" select.
 */
export const COUNTRIES: Country[] = [
  { code: "TN", dialCode: "216", flag: "🇹🇳", name: { ar: "تونس", fr: "Tunisie", en: "Tunisia" } },
  { code: "DZ", dialCode: "213", flag: "🇩🇿", name: { ar: "الجزائر", fr: "Algérie", en: "Algeria" } },
  { code: "MA", dialCode: "212", flag: "🇲🇦", name: { ar: "المغرب", fr: "Maroc", en: "Morocco" } },
  { code: "LY", dialCode: "218", flag: "🇱🇾", name: { ar: "ليبيا", fr: "Libye", en: "Libya" } },
  { code: "EG", dialCode: "20", flag: "🇪🇬", name: { ar: "مصر", fr: "Égypte", en: "Egypt" } },
  { code: "SA", dialCode: "966", flag: "🇸🇦", name: { ar: "السعودية", fr: "Arabie Saoudite", en: "Saudi Arabia" } },
  { code: "AE", dialCode: "971", flag: "🇦🇪", name: { ar: "الإمارات", fr: "Émirats Arabes Unis", en: "United Arab Emirates" } },
  { code: "QA", dialCode: "974", flag: "🇶🇦", name: { ar: "قطر", fr: "Qatar", en: "Qatar" } },
  { code: "KW", dialCode: "965", flag: "🇰🇼", name: { ar: "الكويت", fr: "Koweït", en: "Kuwait" } },
  { code: "FR", dialCode: "33", flag: "🇫🇷", name: { ar: "فرنسا", fr: "France", en: "France" } },
  { code: "DE", dialCode: "49", flag: "🇩🇪", name: { ar: "ألمانيا", fr: "Allemagne", en: "Germany" } },
  { code: "IT", dialCode: "39", flag: "🇮🇹", name: { ar: "إيطاليا", fr: "Italie", en: "Italy" } },
  { code: "GB", dialCode: "44", flag: "🇬🇧", name: { ar: "بريطانيا", fr: "Royaume-Uni", en: "United Kingdom" } },
  { code: "CA", dialCode: "1", flag: "🇨🇦", name: { ar: "كندا", fr: "Canada", en: "Canada" } },
  { code: "US", dialCode: "1", flag: "🇺🇸", name: { ar: "الولايات المتحدة", fr: "États-Unis", en: "United States" } },
  { code: "OTHER", dialCode: "", flag: "🌍", name: { ar: "دولة أخرى", fr: "Autre pays", en: "Other" } },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]!;

export function findCountryByCode(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}

export function findCountryByDialCode(dialCode: string): Country {
  return COUNTRIES.find((c) => c.dialCode === dialCode) ?? DEFAULT_COUNTRY;
}
