"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { PricingCard } from "@/components/pricing-card";
import { useTranslation } from "@/lib/i18n/use-translation";

export function PricingPreview() {
  const { t } = useTranslation();

  return (
    <section id="pricing" className="bg-ink-50/60 py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-gold-600">{t.pricing.eyebrow}</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-ink-900 sm:text-4xl">
            {t.pricing.title}
          </h2>
          <p className="mt-4 text-balance text-ink-500">{t.pricing.description}</p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {t.pricing.plans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 100}>
              <PricingCard
                name={plan.name}
                price={plan.price}
                period={plan.period}
                currency={t.pricing.currency}
                description={plan.description}
                features={plan.features}
                ctaLabel={t.pricing.choosePlan}
                ctaHref="/register"
                highlighted={index === 2}
                badgeLabel={index === 2 ? t.pricing.mostPopular : undefined}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
