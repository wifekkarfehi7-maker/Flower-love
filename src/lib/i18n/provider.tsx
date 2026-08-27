"use client";

import * as React from "react";

import { defaultLocale, isLocale, localeDirection, STORAGE_KEY, type Locale } from "./config";
import { dictionaries } from "./dictionaries";
import type { Dictionary } from "./types";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: Dictionary;
  dir: "rtl" | "ltr";
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

/**
 * Inline, blocking script that applies the stored locale to <html> before
 * React hydrates — prevents an RTL/LTR + font flash on first paint.
 */
export const NO_FLASH_LOCALE_SCRIPT = `
(function () {
  try {
    var STORAGE_KEY = ${JSON.stringify(STORAGE_KEY)};
    var locale = localStorage.getItem(STORAGE_KEY) || ${JSON.stringify(defaultLocale)};
    var dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", dir);
  } catch (e) {}
})();
`;

export function LanguageProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (isLocale(stored) && stored !== locale) {
      setLocaleState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", localeDirection[locale]);
  }, [locale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — locale still applies for this session
    }
  }, []);

  const value = React.useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      dictionary: dictionaries[locale],
      dir: localeDirection[locale],
    }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
