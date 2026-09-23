"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useTranslation } from "@/lib/i18n/use-translation";

export function WhatsAppSection() {
  const { t } = useTranslation();

  return (
    <section id="contact" className="bg-background py-section">
      <Container>
        <Reveal
          animation="scale-in"
          className="mx-auto flex max-w-4xl flex-col items-center bg-ink-950 px-6 py-section-sm text-center sm:px-16"
        >
          <span aria-hidden="true" className="block h-px w-12 bg-gold-400/60" />
          <h2 className="type-h1 mt-8 text-balance text-paper">{t.whatsapp.title}</h2>
          <p className="type-lead mt-5 max-w-xl text-balance text-ink-300">{t.whatsapp.description}</p>
          <WhatsAppButton message={t.whatsapp.supportMessage} size="lg" className="mt-10">
            {t.whatsapp.cta}
          </WhatsAppButton>
        </Reveal>
      </Container>
    </section>
  );
}
