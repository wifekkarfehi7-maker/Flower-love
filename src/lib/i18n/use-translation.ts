"use client";

import { useLanguage } from "./provider";

/** Convenience hook: `const { t, locale, dir } = useTranslation();` */
export function useTranslation() {
  const { dictionary, locale, setLocale, dir } = useLanguage();
  return { t: dictionary, locale, setLocale, dir };
}
