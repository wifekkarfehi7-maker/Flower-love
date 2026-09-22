"use client";

import Link from "next/link";

import { Container } from "@/components/ui/container";
import { TemplateCard } from "@/components/templates/template-card";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TemplateCardItem } from "@/lib/templates/presentation";

/**
 * A first look at the collection: real renders of the first four templates,
 * the same cards as /templates. The rest of the landing page is redesigned
 * separately; this section only stops showing invented cards.
 */
export function TemplatesPreview({ items }: { items: TemplateCardItem[] }) {
  const { t, locale } = useTranslation();
  const isArabic = locale === "ar";

  return (
    <section id="templates" className="bg-background py-24 sm:py-32">
      <Container>
        <div className="flex flex-col gap-6 border-b border-ink-900/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className={isArabic ? "text-[0.8rem] text-ink-400" : "text-[0.66rem] uppercase tracking-[0.3em] text-ink-400"}>
              {t.templates.eyebrow}
            </p>
            <h2
              className={
                isArabic
                  ? "mt-4 font-editorial text-[2.1rem] leading-[1.4] text-ink-900 sm:text-[2.6rem]"
                  : "mt-4 font-editorial text-[2.2rem] font-light leading-[1.1] text-ink-900 sm:text-[2.8rem]"
              }
            >
              {t.templates.title}
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-500">{t.templates.description}</p>
          </div>
          <Link
            href="/templates"
            className="self-start border-b border-ink-900 pb-0.5 text-[0.85rem] text-ink-900 outline-offset-4 transition-colors hover:border-ink-400 hover:text-ink-600 focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-900 sm:self-auto"
          >
            {t.templates.viewAll}
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {items.slice(0, 4).map((item, index) => (
            <TemplateCard key={item.slug} item={item} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
