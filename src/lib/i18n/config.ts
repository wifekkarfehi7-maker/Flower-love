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

export const localeFlag: Record<Locale, string> = {
  ar: "🇹🇳",
  fr: "🇫🇷",
  en: "🇬🇧",
};

export const STORAGE_KEY = "flower-love-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
