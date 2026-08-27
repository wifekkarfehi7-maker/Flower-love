"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateRecord } from "@/types/invitation";

const STRINGS = {
  template: {
    ar: { back: "كل النماذج", use: "استعمال هذا النموذج" },
    fr: { back: "Tous les modèles", use: "Utiliser ce modèle" },
    en: { back: "All templates", use: "Use this template" },
  },
  owner: {
    ar: { back: "العودة للتعديل", use: "" },
    fr: { back: "Retour à l'édition", use: "" },
    en: { back: "Back to editor", use: "" },
  },
};
const PREVIEW_LABEL = { ar: "معاينة", fr: "Aperçu", en: "Preview" };

export function InvitationPreviewShell({
  template,
  invitation,
  variant = "template",
  backHref = "/templates",
  ctaHref = "/register",
  isPreview = true,
}: {
  template: TemplateRecord;
  invitation: InvitationData;
  variant?: "template" | "owner";
  backHref?: string;
  ctaHref?: string | null;
  isPreview?: boolean;
}) {
  const { locale, dir } = useTranslation();
  const t = STRINGS[variant][locale];
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-white/10 bg-ink-950/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link href={backHref} className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
          <BackIcon className="h-4 w-4" />
          {t.back}
        </Link>
        <span className="hidden text-sm font-semibold text-gold-300 sm:inline">
          {PREVIEW_LABEL[locale]} — {locale === "ar" ? template.nameAr : template.name}
        </span>
        {ctaHref && (
          <Link href={ctaHref} className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-ink-950 shadow-soft">
            {t.use}
          </Link>
        )}
      </div>

      <InvitationRenderer invitation={invitation} theme={template.theme} fonts={template.fonts} isPreview={isPreview} />
    </div>
  );
}
