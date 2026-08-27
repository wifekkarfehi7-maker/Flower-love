"use client";

import { AlertTriangle } from "lucide-react";

import { WhatsAppButton } from "@/components/whatsapp-button";
import { useTranslation } from "@/lib/i18n/use-translation";

export function NotConfiguredNotice() {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-gold-300/60 bg-gold-50 p-5 text-center">
      <AlertTriangle className="mx-auto h-6 w-6 text-gold-600" />
      <p className="mt-3 font-heading text-base font-semibold text-ink-900">{t.auth.notConfiguredTitle}</p>
      <p className="mt-1.5 text-sm text-ink-500">{t.auth.notConfiguredDescription}</p>
      <WhatsAppButton message={t.comingSoon.builderWhatsappMessage} size="sm" className="mt-4">
        {t.whatsapp.cta}
      </WhatsAppButton>
    </div>
  );
}
