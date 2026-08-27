"use client";

import Link from "next/link";
import { Flower2, Gem, Moon, Sparkle, Sparkles, Square, Sun, Waves } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

const TEMPLATE_STYLES = [
  {
    icon: Gem,
    card: "bg-gradient-to-br from-[#3a2c0f] via-[#5e461b] to-[#1c1508] text-gold-100",
    heading: "font-arabicDisplay",
    ring: "ring-gold-400/40",
  },
  {
    icon: Sun,
    card: "bg-gradient-to-br from-white via-[#faf7f0] to-[#f0ebe0] text-ink-800",
    heading: "font-heading",
    ring: "ring-ink-200",
  },
  {
    icon: Flower2,
    card: "bg-gradient-to-br from-[#fbeef0] via-[#f6dfe4] to-[#eec2cb] text-rose-700",
    heading: "font-heading italic",
    ring: "ring-rose-200",
  },
  {
    icon: Sparkles,
    card: "bg-gradient-to-br from-[#3c1620] via-[#5c2230] to-[#26101a] text-rose-100",
    heading: "font-arabicDisplay",
    ring: "ring-rose-400/30",
  },
  {
    icon: Square,
    card: "bg-gradient-to-br from-[#12181f] via-[#1e2833] to-[#0a0e12] text-white",
    heading: "font-body uppercase tracking-[0.2em]",
    ring: "ring-white/10",
  },
  {
    icon: Moon,
    card: "bg-gradient-to-br from-[#0c0a06] via-[#1c1608] to-[#000000] text-gold-300",
    heading: "font-arabicDisplay",
    ring: "ring-gold-500/30",
  },
  {
    icon: Waves,
    card: "bg-gradient-to-br from-[#0e3b34] via-[#155048] to-[#082420] text-gold-100",
    heading: "font-arabicDisplay",
    ring: "ring-gold-300/30",
  },
  {
    icon: Sparkle,
    card: "bg-gradient-to-br from-[#f7f7f5] via-white to-[#efefec] text-ink-700",
    heading: "font-body font-light tracking-wide",
    ring: "ring-ink-100",
  },
] as const;

const TEMPLATE_SLUGS = [
  "luxury-gold",
  "elegant-white",
  "floral",
  "romantic",
  "modern",
  "black-gold",
  "traditional-arabic",
  "minimal",
] as const;

export function TemplatesPreview() {
  const { t } = useTranslation();

  return (
    <section id="templates" className="bg-ink-50/60 py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-gold-600">{t.templates.eyebrow}</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold text-ink-900 sm:text-4xl">
            {t.templates.title}
          </h2>
          <p className="mt-4 text-balance text-ink-500">{t.templates.description}</p>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {t.templates.items.map((item, index) => {
            const style = TEMPLATE_STYLES[index % TEMPLATE_STYLES.length]!;
            const Icon = style.icon;
            return (
              <Reveal key={item.name} delay={index * 60} animation="scale-in">
                <Link
                  href={`/templates/${TEMPLATE_SLUGS[index % TEMPLATE_SLUGS.length]}/preview`}
                  className={cn(
                    "group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-card ring-1 transition-transform duration-500 hover:-translate-y-1",
                    style.card,
                    style.ring
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="h-5 w-5 opacity-80" />
                    <Badge variant="outline" className="border-white/30 bg-black/10 text-[10px] opacity-90 backdrop-blur-sm">
                      {item.category}
                    </Badge>
                  </div>
                  <div>
                    <p className={cn("text-lg leading-snug", style.heading)}>{item.name}</p>
                    <p className="mt-1 text-xs opacity-70">{item.nameAr}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/templates">{t.templates.viewAll}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
