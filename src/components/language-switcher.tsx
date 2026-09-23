"use client";

import * as React from "react";

import { locales, localeLabel, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/** Each language named in its own script — ع for Arabic. */
const MARK: Record<Locale, string> = { ar: "ع", fr: "FR", en: "EN" };

/**
 * Three marks set inline rather than a globe icon and a dropdown: one tap to
 * switch, and the current language is visible at all times. The active mark
 * takes a brass hairline. Each button carries its own `lang`, so it is read
 * in its own language, and its accessible name starts with the visible mark.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div role="group" aria-label={t.common.langSwitcherLabel} className={cn("flex items-baseline", className)}>
      {locales.map((code, i) => {
        const active = locale === code;
        return (
          <React.Fragment key={code}>
            {i > 0 && (
              <span aria-hidden="true" className="mx-0.5 text-[0.7rem] text-ink-300">
                ·
              </span>
            )}
            <button
              type="button"
              lang={code}
              aria-pressed={active}
              onClick={() => setLocale(code as Locale)}
              className={cn(
                "relative px-1.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                code === "ar" ? "text-[0.95rem] leading-none" : "text-[0.7rem] tracking-[0.14em]",
                active ? "text-ink-900" : "text-ink-400 hover:text-ink-800"
              )}
            >
              {MARK[code as Locale]}
              <span className="sr-only"> — {localeLabel[code as Locale]}</span>
              {active && <span aria-hidden="true" className="absolute inset-x-1.5 -bottom-0.5 h-px bg-gold-500" />}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
