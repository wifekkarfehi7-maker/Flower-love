"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { useProtectedHref } from "@/lib/auth/use-protected-href";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationData, TemplateRecord } from "@/types/invitation";

const STRINGS = {
  template: {
    ar: { back: "كل النماذج", use: "اختيار هذا النموذج" },
    fr: { back: "Tous les modèles", use: "Choisir ce modèle" },
    en: { back: "All templates", use: "Use this template" },
  },
  owner: {
    ar: { back: "العودة للتعديل", use: "" },
    fr: { back: "Retour à l'édition", use: "" },
    en: { back: "Back to editor", use: "" },
  },
};

/**
 * The bar that frames a preview. It stays quiet on purpose — ink, a hairline
 * and small type — so the invitation underneath is the only thing with a
 * voice. `data-preview-chrome` lets the preview generator hide it.
 */
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
  const primaryName = locale === "ar" ? template.nameAr : template.name;
  const secondaryName = locale === "ar" ? template.name : template.nameAr;
  const signedInAwareCta = useProtectedHref(ctaHref ?? "/");

  return (
    <div className="min-h-screen">
      <div
        data-preview-chrome=""
        className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/95 text-white backdrop-blur-sm"
      >
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
          <Link
            href={backHref}
            className="flex items-center gap-2 justify-self-start text-[0.8rem] text-white/65 transition-colors hover:text-white"
          >
            <BackIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {/* Visually just the arrow on phones, but always named for screen readers. */}
            <span className="sr-only sm:not-sr-only">{t.back}</span>
          </Link>

          <div className="flex flex-col items-center leading-none">
            <span
              className="text-[1.05rem] text-white"
              style={{ fontFamily: "var(--font-cormorant), var(--font-naskh), Georgia, serif", letterSpacing: "0.04em" }}
            >
              {primaryName}
            </span>
            {secondaryName && (
              <span className="mt-1 hidden text-[0.62rem] text-white/45 sm:block">{secondaryName}</span>
            )}
          </div>

          {ctaHref ? (
            <Link
              href={signedInAwareCta}
              className="justify-self-end border border-white/35 px-3.5 py-2 text-[0.72rem] text-white transition-colors hover:border-white hover:bg-white hover:text-ink-950 sm:px-5"
            >
              {t.use}
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

      <InvitationRenderer invitation={invitation} theme={template.theme} fonts={template.fonts} isPreview={isPreview} />
    </div>
  );
}
