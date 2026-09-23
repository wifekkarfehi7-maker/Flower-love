"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useTranslation } from "@/lib/i18n/use-translation";

export function Hero() {
  const { t, dir } = useTranslation();
  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-ink-950 py-section">

      <Container className="relative grid items-center gap-16 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="type-meta flex items-center gap-4 text-gold-300">
              <span aria-hidden="true" className="block h-px w-8 bg-gold-400/60" />
              {t.hero.badge}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="type-display mt-8 text-balance text-paper">
              {t.hero.title}
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="type-lead mt-7 max-w-xl text-balance text-ink-300">
              {t.hero.description}
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="light" size="lg">
                <Link href="/register">
                  {t.hero.ctaPrimary}
                  <ArrowIcon />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="border-white/25 text-paper hover:border-paper">
                <a href="#templates">{t.hero.ctaSecondary}</a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <dl className="mt-14 grid grid-cols-1 border-t border-white/10 sm:grid-cols-3 sm:gap-6 sm:pt-8">
              {[
                [t.hero.stat1Value, t.hero.stat1Label],
                [t.hero.stat2Value, t.hero.stat2Label],
                [t.hero.stat3Value, t.hero.stat3Label],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4 sm:flex-col-reverse sm:items-start sm:justify-end sm:gap-1 sm:border-0 sm:py-0"
                >
                  <dt className="type-small text-ink-400">{label}</dt>
                  <dd className="type-h2 type-numeral text-paper">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={250} animation="scale-in" className="relative mx-auto w-full max-w-sm">
          <div className="relative border border-gold-400/25 bg-ink-900 px-8 py-12 text-center">
            <p className="relative font-arabicDisplay text-sm text-gold-300/80">
              وليمة الفرح
            </p>
            <h2 className="type-h1 relative mt-6 text-paper">
              {t.hero.previewCoupleNames}
            </h2>
            <div className="relative mx-auto mt-6 h-px w-16 bg-gold-400/50" />
            <p className="type-numeral relative mt-6 font-heading text-lg tracking-[0.18em] text-gold-200">
              {t.hero.previewDate}
            </p>
            <div className="relative mt-10">
              <span className="ui-label inline-flex items-center border border-gold-400/50 px-6 py-3 text-[0.75rem] text-gold-200">
                {t.hero.previewOpen}
              </span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
