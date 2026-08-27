"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useTranslation } from "@/lib/i18n/use-translation";

export function Hero() {
  const { t, dir } = useTranslation();
  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-ink-950 pb-24 pt-16 sm:pb-32 sm:pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,170,66,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(200,85,102,0.15),transparent_40%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-noise opacity-40" />

      <Container className="relative grid items-center gap-16 lg:grid-cols-2">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t.hero.badge}
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-6 text-balance font-heading text-4xl font-bold leading-[1.25] text-white sm:text-5xl lg:text-[3.4rem]">
              {t.hero.title}
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-ink-200">
              {t.hero.description}
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold" size="lg">
                <Link href="/register">
                  {t.hero.ctaPrimary}
                  <ArrowIcon />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-ink-600 text-white hover:bg-white/5">
                <a href="#templates">
                  <Play className="h-4 w-4" />
                  {t.hero.ctaSecondary}
                </a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {[
                [t.hero.stat1Value, t.hero.stat1Label],
                [t.hero.stat2Value, t.hero.stat2Label],
                [t.hero.stat3Value, t.hero.stat3Label],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-heading text-2xl font-bold text-gold-300 sm:text-3xl">{value}</dd>
                  <dd className="mt-1 text-xs text-ink-300 sm:text-sm">{label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={250} animation="scale-in" className="relative mx-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-[2rem] border border-gold-400/20 bg-gradient-to-b from-ink-800 to-ink-950 p-10 text-center shadow-luxe">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(240,218,150,0.25),transparent_60%)]"
            />
            <p className="relative font-arabicDisplay text-sm tracking-[0.3em] text-gold-300/80">
              وليمة الفرح
            </p>
            <h2 className="relative mt-6 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
              {t.hero.previewCoupleNames}
            </h2>
            <div className="relative mx-auto mt-6 h-px w-16 bg-gold-400/50" />
            <p className="relative mt-6 font-heading text-lg tracking-widest text-gold-200">
              {t.hero.previewDate}
            </p>
            <div className="relative mt-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-ink-950 shadow-soft">
                {t.hero.previewOpen}
              </span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -inset-x-6 -bottom-6 -z-10 h-24 rounded-full bg-gold-500/20 blur-3xl"
          />
        </Reveal>
      </Container>
    </section>
  );
}
