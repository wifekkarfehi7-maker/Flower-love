export const locales = ["ar", "fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  fr: "ltr",
  en: "ltr",
};

export const localeLabel: Record<Locale, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
};

export const localeShortLabel: Record<Locale, string> = {
  ar: "ع",
  fr: "FR",
  en: "EN",
};

export const localeHtmlLang: Record<Locale, string> = {
  ar: "ar-TN",
  fr: "fr-TN",
  en: "en",
};

export const STORAGE_KEY = "menuqr-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
