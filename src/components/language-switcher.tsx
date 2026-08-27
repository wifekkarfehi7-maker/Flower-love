"use client";

import * as React from "react";
import { Globe } from "lucide-react";

import { locales, localeLabel, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.common.langSwitcherLabel}
        className="flex h-10 items-center gap-1.5 rounded-full border border-ink-200 px-3 text-sm font-medium text-ink-700 transition-colors hover:border-gold-300 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{localeLabel[locale]}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-card animate-scale-in"
        >
          {locales.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={locale === code}
                onClick={() => {
                  setLocale(code as Locale);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-start text-sm transition-colors hover:bg-ink-50",
                  locale === code ? "font-semibold text-gold-700" : "text-ink-700"
                )}
              >
                {localeLabel[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
