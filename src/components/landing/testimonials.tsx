"use client";

import { Quote } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useTranslation } from "@/lib/i18n/use-translation";

export function Testimonials() {
  const { t } = useTranslation();

  return (
    <section className="bg-background py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-gold-600">{t.testimonials.eyebrow}</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-ink-900 sm:text-4xl">
            {t.testimonials.title}
          </h2>
          <p className="mt-4 text-balance text-ink-500">{t.testimonials.description}</p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {t.testimonials.items.map((item, index) => (
            <Reveal key={item.name} delay={index * 100}>
              <figure className="flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-7 shadow-soft">
                <Quote className="h-7 w-7 text-gold-300" />
                <blockquote className="mt-4 flex-1 text-balance leading-relaxed text-ink-600">
                  {item.text}
                </blockquote>
                <figcaption className="mt-6 border-t border-ink-100 pt-4">
                  <p className="font-heading font-semibold text-ink-900">{item.name}</p>
                  <p className="text-sm text-ink-400">{item.location}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
