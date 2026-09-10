"use client";

import {
  ArrowRight,
  BarChart3,
  Check,
  Languages,
  Palette,
  QrCode,
  RefreshCw,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { QrImage } from "@/components/qr/qr-image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { planFeatureKeys } from "@/lib/billing/provider";
import { SITE_URL } from "@/lib/config";
import { formatPrice, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { menuUrl } from "@/lib/qr/urls";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types/database";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const DEMO_SLUG = "cafe-el-medina";

/** A small, honest preview of the real menu layout — no screenshots to go stale. */
function PhonePreview() {
  const { t } = useTranslation();

  const items = [
    { name: "Pizza Margherita", price: "12.500 DT" },
    { name: "Sandwich Escalope", price: "7.500 DT" },
    { name: "Cappuccino", price: "3.500 DT" },
  ];

  return (
    <div className="relative mx-auto w-[260px] rounded-[2rem] border-[10px] border-sand-950 bg-sand-950 shadow-pop">
      <div className="overflow-hidden rounded-[1.4rem] bg-[#f7f8f9]">
        <div className="flex items-center gap-2 bg-brand-700 px-4 pb-4 pt-6 text-white">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">C</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Café El Medina</p>
            <p className="text-[11px] text-white/75">{t.menu.open}</p>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-hidden px-3 py-2.5">
          {["Pizza", "Sandwich", "Boissons"].map((chip, index) => (
            <span
              key={chip}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                index === 0 ? "bg-brand-700 text-white" : "bg-white text-sand-500"
              )}
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="space-y-2 px-3 pb-4">
          {items.map((item) => (
            <div key={item.name} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-sand-950">{item.name}</p>
                {/* Latin currency codes reorder under bidi, so this sample keeps its own direction. */}
                <p dir="ltr" className="text-[11px] font-semibold text-brand-700 rtl:text-end">
                  {item.price}
                </p>
              </div>
              <span className="size-10 shrink-0 rounded-lg bg-sand-100" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ plans }: { plans: SubscriptionPlan[] }) {
  const { t, locale } = useTranslation();

  const steps = [
    { title: t.landing.step1Title, text: t.landing.step1Text, icon: Sparkles },
    { title: t.landing.step2Title, text: t.landing.step2Text, icon: Smartphone },
    { title: t.landing.step3Title, text: t.landing.step3Text, icon: QrCode },
  ];

  const features = [
    { title: t.landing.feature1Title, text: t.landing.feature1Text, icon: Languages },
    { title: t.landing.feature2Title, text: t.landing.feature2Text, icon: QrCode },
    { title: t.landing.feature3Title, text: t.landing.feature3Text, icon: RefreshCw },
    { title: t.landing.feature4Title, text: t.landing.feature4Text, icon: BarChart3 },
    { title: t.landing.feature5Title, text: t.landing.feature5Text, icon: Smartphone },
    { title: t.landing.feature6Title, text: t.landing.feature6Text, icon: Palette },
  ];

  const benefits = [
    t.landing.benefit1,
    t.landing.benefit2,
    t.landing.benefit3,
    t.landing.benefit4,
    t.landing.benefit5,
    t.landing.benefit6,
  ];

  const faqs = [
    { q: t.landing.faq1Q, a: t.landing.faq1A },
    { q: t.landing.faq2Q, a: t.landing.faq2A },
    { q: t.landing.faq3Q, a: t.landing.faq3A },
    { q: t.landing.faq4Q, a: t.landing.faq4A },
    { q: t.landing.faq5Q, a: t.landing.faq5A },
    { q: t.landing.faq6Q, a: t.landing.faq6A },
  ];

  const featureLabels = t.plans as Record<string, string>;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="border-b border-border bg-gradient-to-b from-brand-50/60 to-background">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="default" className="mb-4">
                {t.landing.heroBadge}
              </Badge>

              <h1 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                {t.landing.heroTitle}
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t.landing.heroSubtitle}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    {t.landing.heroCtaPrimary}
                    <ArrowRight className="rtl-flip" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-it-works">{t.landing.heroCtaSecondary}</a>
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">{t.landing.heroNote}</p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <PhonePreview />

              <div className="hidden flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex">
                <QrImage value={menuUrl(DEMO_SLUG)} size={132} />
                <p className="max-w-[9rem] text-center text-xs text-muted-foreground">{t.landing.heroScanHint}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.landing.howItWorksTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.landing.howItWorksSubtitle}</p>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative rounded-xl border border-border bg-card p-6 shadow-card">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="features" className="scroll-mt-20 border-y border-border bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.landing.featuresTitle}</h2>
              <p className="mt-3 text-muted-foreground">{t.landing.featuresSubtitle}</p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-3.5 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.landing.benefitsTitle}</h2>
              <ul className="mt-6 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
              <h3 className="text-xl font-semibold">{t.landing.demoTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.landing.demoSubtitle}</p>
              <div className="mt-6 flex justify-center">
                <QrImage value={menuUrl(DEMO_SLUG)} size={160} />
              </div>
              <Button asChild variant="outline" className="mt-6">
                <a href={`/menu/${DEMO_SLUG}`}>
                  {t.landing.demoCta}
                  <ArrowRight className="rtl-flip" aria-hidden />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-y border-border bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.landing.pricingTitle}</h2>
              <p className="mt-3 text-muted-foreground">{t.landing.pricingSubtitle}</p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {plans.map((plan, index) => {
                const price = Number(plan.price_monthly);
                const highlighted = index === 1;

                return (
                  <Card key={plan.id} className={cn("flex flex-col", highlighted && "border-primary ring-1 ring-primary/20")}>
                    <CardHeader>
                      <CardTitle>{localized(plan, "name", locale)}</CardTitle>
                      <p className="text-sm text-muted-foreground">{localized(plan, "description", locale)}</p>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-5">
                      <p className="text-3xl font-bold tabular-nums">
                        {price === 0 ? (
                          t.landing.pricingFree
                        ) : (
                          <>
                            {formatPrice(price, plan.currency, locale)}
                            <span className="text-sm font-normal text-muted-foreground">
                              {t.subscription.perMonth}
                            </span>
                          </>
                        )}
                      </p>

                      <ul className="flex-1 space-y-2 text-sm">
                        {planFeatureKeys(plan).map((key) => (
                          <li key={key} className="flex items-start gap-2">
                            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                            <span>{featureLabels[key] ?? key}</span>
                          </li>
                        ))}
                      </ul>

                      <Button asChild variant={highlighted ? "default" : "outline"}>
                        <Link href="/register">{price === 0 ? t.landing.pricingCta : t.landing.pricingContact}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">{t.landing.pricingNote}</p>
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.landing.faqTitle}</h2>

          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="border-t border-border bg-brand-700 text-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.landing.ctaTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{t.landing.ctaText}</p>
            <Button asChild size="lg" variant="accent" className="mt-7">
              <Link href="/register">
                {t.landing.ctaButton}
                <ArrowRight className="rtl-flip" aria-hidden />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-white/70" dir="ltr">
              {SITE_URL.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
