"use client";

import * as React from "react";

import { defaultLocale, isLocale, localeDirection, localeHtmlLang, STORAGE_KEY, type Locale } from "./config";
import { dictionaries } from "./dictionaries";
import type { Dictionary } from "./types";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  dir: "rtl" | "ltr";
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

/**
 * Blocking script that applies the stored locale to <html> before hydration,
 * so Arabic visitors never see an LTR flash on first paint.
 */
export const NO_FLASH_LOCALE_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    if (!stored) return;
    if (stored !== "ar" && stored !== "fr" && stored !== "en") return;
    document.documentElement.setAttribute("lang", stored === "ar" ? "ar-TN" : stored === "fr" ? "fr-TN" : "en");
    document.documentElement.setAttribute("dir", stored === "ar" ? "rtl" : "ltr");
  } catch (e) {}
})();
`;

export function LanguageProvider({
  children,
  initialLocale = defaultLocale,
  /** Public menus open in the venue's own language, ignoring a stored preference. */
  persist = true,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  persist?: boolean;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  React.useEffect(() => {
    if (!persist) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
    }
  }, [persist]);

  React.useEffect(() => {
    document.documentElement.setAttribute("lang", localeHtmlLang[locale]);
    document.documentElement.setAttribute("dir", localeDirection[locale]);
  }, [locale]);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing — the choice still applies for this session.
    }
  }, []);

  const value = React.useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale], dir: localeDirection[locale] }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used inside a LanguageProvider");
  }
  return ctx;
}
