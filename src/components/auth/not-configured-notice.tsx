"use client";

import { WhatsAppButton } from "@/components/whatsapp-button";
import { useTranslation } from "@/lib/i18n/use-translation";

export function NotConfiguredNotice() {
  const { t } = useTranslation();

  return (
    <div role="status" className="border-y border-ink-900/10 py-8 text-center">
      <p className="type-h3">{t.auth.notConfiguredTitle}</p>
      <p className="type-small mt-3">{t.auth.notConfiguredDescription}</p>
      <WhatsAppButton message={t.comingSoon.builderWhatsappMessage} size="sm" className="mt-6">
        {t.whatsapp.cta}
      </WhatsAppButton>
    </div>
  );
}
