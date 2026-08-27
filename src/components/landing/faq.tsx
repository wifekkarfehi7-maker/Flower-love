"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n/use-translation";

export function Faq() {
  const { t } = useTranslation();

  return (
    <section id="faq" className="bg-ink-50/60 py-24 sm:py-32">
      <Container className="max-w-3xl">
        <Reveal className="text-center">
          <span className="text-sm font-semibold tracking-wide text-gold-600">{t.faq.eyebrow}</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-ink-900 sm:text-4xl">
            {t.faq.title}
          </h2>
        </Reveal>

        <Reveal delay={150} className="mt-12 rounded-2xl border border-ink-100 bg-white px-6 shadow-soft sm:px-8">
          <Accordion type="single" collapsible>
            {t.faq.items.map((item, index) => (
              <AccordionItem key={item.q} value={`item-${index}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </section>
  );
}
