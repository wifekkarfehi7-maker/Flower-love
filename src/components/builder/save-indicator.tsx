"use client";

import { Check, Loader2 } from "lucide-react";

import { useTranslation } from "@/lib/i18n/use-translation";
import type { SaveStatus } from "@/hooks/use-invitation-autosave";
import { cn } from "@/lib/utils";

const LABEL = {
  ar: { saving: "جاري الحفظ...", saved: "تم الحفظ ✓", error: "تعذر الحفظ" },
  fr: { saving: "Enregistrement...", saved: "Enregistré ✓", error: "Échec de l'enregistrement" },
  en: { saving: "Saving...", saved: "Saved ✓", error: "Save failed" },
};

export function SaveIndicator({ status, className }: { status: SaveStatus; className?: string }) {
  const { locale } = useTranslation();
  if (status === "idle") return <span className={className} />;

  const t = LABEL[locale];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        status === "error" ? "text-destructive" : "text-ink-400",
        className
      )}
    >
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved" && <Check className="h-3 w-3 text-emerald-600" />}
      {t[status]}
    </span>
  );
}
