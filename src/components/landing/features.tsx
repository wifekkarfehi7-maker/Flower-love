"use client";

import {
  CalendarHeart,
  Fingerprint,
  Languages,
  MapPin,
  QrCode,
  TimerReset,
  UsersRound,
  Wand2,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useTranslation } from "@/lib/i18n/use-translation";

const ICONS = [Wand2, Languages, CalendarHeart, UsersRound, Fingerprint, TimerReset, MapPin, QrCode];

export function Features() {
  const { t } = useTranslation();

  return (
    <section className="bg-background py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-gold-600">{t.features.eyebrow}</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-ink-900 sm:text-4xl">
            {t.features.title}
          </h2>
          <p className="mt-4 text-balance text-ink-500">{t.features.description}</p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.items.map((feature, index) => {
            const Icon = ICONS[index % ICONS.length]!;
            return (
              <Reveal key={feature.title} delay={index * 60}>
                <div className="h-full rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-shadow duration-300 hover:shadow-card">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold text-ink-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{feature.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
