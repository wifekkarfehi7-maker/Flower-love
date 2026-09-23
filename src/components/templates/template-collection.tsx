"use client";

import { Container } from "@/components/ui/container";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TemplateCardItem } from "@/lib/templates/presentation";
import { TemplateCard } from "./template-card";

/** Arabic counts agree with the noun: 3–10 take the plural, 11+ the accusative singular. */
function arabicCount(n: number) {
  if (n === 1) return "نموذج واحد";
  if (n === 2) return "نموذجان";
  if (n >= 3 && n <= 10) return `${n} نماذج`;
  return `${n} نموذجاً`;
}

const STRINGS = {
  ar: {
    eyebrow: "المجموعة",
    title: "دعوات تُفتح كرسالة ثمينة",
    body: "لكلّ نموذج خطوطه وألوانه وطريقة وصوله إلى ضيوفكم: ظرفٌ مختوم، ستارة، أو ختمٌ من الشمع. افتحوا أيّ نموذج لتعيشوه كما سيعيشه ضيوفكم.",
    count: arabicCount,
    languages: "بالعربية والفرنسية والإنجليزية",
  },
  fr: {
    eyebrow: "La collection",
    title: "Des invitations qui s'ouvrent comme une lettre précieuse",
    body: "Chaque modèle a sa typographie, sa palette et sa façon d'arriver chez vos invités : enveloppe scellée, rideau, sceau de cire. Ouvrez-en un pour le vivre comme eux.",
    count: (n: number) => `${n} modèle${n > 1 ? "s" : ""}`,
    languages: "En arabe, français et anglais",
  },
  en: {
    eyebrow: "The collection",
    title: "Invitations that open like a treasured letter",
    body: "Each template has its own type, palette and way of arriving: a sealed envelope, a curtain, a wax seal. Open one to experience it exactly as your guests will.",
    count: (n: number) => `${n} template${n === 1 ? "" : "s"}`,
    languages: "In Arabic, French and English",
  },
};

export function TemplateCollection({ items }: { items: TemplateCardItem[] }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  return (
    <section className="bg-background">
      <Container className="pb-section pt-section-sm">
        <header className="max-w-2xl">
          <p className="type-meta">{t.eyebrow}</p>
          <h1 className="type-display mt-6">{t.title}</h1>
          <p className="type-lead mt-7 max-w-xl">{t.body}</p>
        </header>

        <div className="type-small mt-block flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink-900/10 pt-4 text-ink-400">
          <span>{t.count(items.length)}</span>
          <span>{t.languages}</span>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 md:grid-cols-3 md:gap-x-8 md:gap-y-20 lg:grid-cols-4">
          {items.map((item, index) => (
            <TemplateCard key={item.slug} item={item} index={index} priority={index < 2} />
          ))}
        </div>
      </Container>
    </section>
  );
}
