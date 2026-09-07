"use client";

import { Check, Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { locales, localeLabel, localeShortLabel, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  variant = "ghost",
  available = locales,
}: {
  className?: string;
  variant?: "ghost" | "outline";
  available?: readonly Locale[];
}) {
  const { locale, setLocale, t } = useTranslation();
  const options = available.length > 0 ? available : locales;

  if (options.length < 2) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className={cn("gap-2", className)} aria-label={t.common.language}>
          <Languages aria-hidden />
          <span className="text-xs font-semibold uppercase">{localeShortLabel[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {options.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => setLocale(option)} className="justify-between">
            <span>{localeLabel[option]}</span>
            {option === locale ? <Check className="size-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
