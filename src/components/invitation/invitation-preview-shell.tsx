"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateRecord } from "@/types/invitation";

const STRINGS = {
  ar: { back: "كل النماذج", preview: "معاينة", use: "استعمال هذا النموذج" },
  fr: { back: "Tous les modèles", preview: "Aperçu", use: "Utiliser ce modèle" },
  en: { back: "All templates", preview: "Preview", use: "Use this template" },
};

export function InvitationPreviewShell({
  template,
  invitation,
}: {
  template: TemplateRecord;
  invitation: InvitationData;
}) {
  const { locale, dir } = useTranslation();
  const t = STRINGS[locale];
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-white/10 bg-ink-950/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link
          href="/templates"
          className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
        >
          <BackIcon className="h-4 w-4" />
          {t.back}
        </Link>
        <span className="hidden text-sm font-semibold text-gold-300 sm:inline">
          {t.preview} — {locale === "ar" ? template.nameAr : template.name}
        </span>
        <Link
          href="/register"
          className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-ink-950 shadow-soft"
        >
          {t.use}
        </Link>
      </div>

      <InvitationRenderer invitation={invitation} theme={template.theme} fonts={template.fonts} isPreview />
    </div>
  );
}
