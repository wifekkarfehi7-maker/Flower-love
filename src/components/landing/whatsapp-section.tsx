"use client";

import { MessageCircle } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useTranslation } from "@/lib/i18n/use-translation";

export function WhatsAppSection() {
  const { t } = useTranslation();

  return (
    <section id="contact" className="bg-background py-24 sm:py-28">
      <Container>
        <Reveal
          animation="scale-in"
          className="relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-[2rem] bg-ink-gradient px-6 py-16 text-center shadow-luxe sm:px-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,211,102,0.15),transparent_55%)]"
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/15">
            <MessageCircle className="h-8 w-8 text-[#25D366]" />
          </span>
          <h2 className="relative mt-6 text-balance font-heading text-3xl font-bold text-white sm:text-4xl">
            {t.whatsapp.title}
          </h2>
          <p className="relative mt-4 max-w-xl text-balance text-ink-300">{t.whatsapp.description}</p>
          <WhatsAppButton message={t.whatsapp.supportMessage} size="lg" className="relative mt-8">
            {t.whatsapp.cta}
          </WhatsAppButton>
        </Reveal>
      </Container>
    </section>
  );
}
