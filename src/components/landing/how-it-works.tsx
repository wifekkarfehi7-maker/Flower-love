"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useTranslation } from "@/lib/i18n/use-translation";

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="bg-background py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-gold-600">{t.howItWorks.eyebrow}</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-ink-900 sm:text-4xl">
            {t.howItWorks.title}
          </h2>
          <p className="mt-4 text-balance text-ink-500">{t.howItWorks.description}</p>
        </Reveal>

        <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {t.howItWorks.steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 80} className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 font-heading text-xl font-bold text-gold-300">
                {index + 1}
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
