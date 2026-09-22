"use client";

import Image from "next/image";
import Link from "next/link";

import { fontFamilyFor } from "@/components/invitation/theme";
import { useProtectedHref } from "@/lib/auth/use-protected-href";
import { useTranslation } from "@/lib/i18n/use-translation";
import { OPENING_LABELS, templateUseHref, type TemplateCardItem } from "@/lib/templates/presentation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    preview: "معاينة",
    use: "اختيار",
    alt: (name: string) => `غلاف دعوة نموذج ${name}`,
    previewOf: (name: string) => `معاينة نموذج ${name}`,
    useOf: (name: string) => `اختيار نموذج ${name}`,
  },
  fr: {
    preview: "Aperçu",
    use: "Choisir",
    alt: (name: string) => `Couverture du modèle ${name}`,
    previewOf: (name: string) => `Aperçu du modèle ${name}`,
    useOf: (name: string) => `Choisir le modèle ${name}`,
  },
  en: {
    preview: "Preview",
    use: "Use",
    alt: (name: string) => `Cover of the ${name} template`,
    previewOf: (name: string) => `Preview the ${name} template`,
    useOf: (name: string) => `Use the ${name} template`,
  },
};

/** The aspect of a phone held upright — the canvas every invitation is composed for. */
const PHONE_RATIO = "390 / 844";

/**
 * Stand-in for a template nobody has rendered yet: its own ground, frame
 * colour and heading face, and nothing invented.
 */
function Plate({ item }: { item: TemplateCardItem }) {
  return (
    <div
      className="relative flex w-full items-center justify-center px-6 text-center"
      style={{ aspectRatio: PHONE_RATIO, backgroundColor: item.swatch.background, color: item.swatch.text }}
    >
      <span aria-hidden="true" className="absolute inset-4 border" style={{ borderColor: item.swatch.primary, opacity: 0.4 }} />
      <span className="relative text-lg leading-snug" style={{ fontFamily: fontFamilyFor(item.swatch.headingFont) }}>
        {item.name}
      </span>
    </div>
  );
}

/**
 * One template in the collection. The rendered invitation carries the card;
 * everything under it is set small and quiet so it never competes.
 */
export function TemplateCard({
  item,
  index,
  priority = false,
  sizes = "(min-width: 1024px) 260px, (min-width: 768px) 30vw, 46vw",
}: {
  item: TemplateCardItem;
  index: number;
  priority?: boolean;
  sizes?: string;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const isArabic = locale === "ar";
  const primaryName = isArabic ? item.nameAr : item.name;
  const secondaryName = isArabic ? item.name : item.nameAr;
  const previewHref = `/templates/${item.slug}/preview`;
  const useHref = useProtectedHref(templateUseHref(item.slug));

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={previewHref}
        aria-label={t.previewOf(primaryName)}
        className="relative block outline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-900"
      >
        {item.cover ? (
          <Image
            src={item.cover.src}
            width={item.cover.width}
            height={item.cover.height}
            alt={t.alt(primaryName)}
            sizes={sizes}
            priority={priority}
            placeholder={item.cover.blurDataURL ? "blur" : "empty"}
            blurDataURL={item.cover.blurDataURL}
            className="block h-auto w-full"
          />
        ) : (
          <Plate item={item} />
        )}
        {/* A hairline so ivory invitations still read as objects on an ivory page. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-ink-900/10 transition-colors duration-500 group-hover:ring-ink-900/30"
        />
      </Link>

      <div className="mt-5 flex items-baseline justify-between gap-3 text-[0.62rem] text-ink-400">
        <span className="tabular-nums tracking-[0.1em]">{String(index + 1).padStart(2, "0")}</span>
        <span className={cn(!isArabic && "uppercase tracking-[0.16em]")}>{OPENING_LABELS[item.opening][locale]}</span>
      </div>

      <h3 className="mt-2 font-editorial text-[1.35rem] leading-snug text-ink-900">{primaryName}</h3>
      {secondaryName && (
        <p className={cn("mt-1 text-ink-400", isArabic ? "text-[0.6rem] uppercase tracking-[0.22em]" : "text-[0.75rem]")}>
          {secondaryName}
        </p>
      )}

      {item.blurb && (
        <p className="mt-3 line-clamp-3 text-[0.8rem] leading-relaxed text-ink-500 md:line-clamp-none">
          {item.blurb[locale]}
        </p>
      )}

      <div className="mt-auto flex items-center gap-5 pt-4 text-[0.78rem]">
        <Link
          href={previewHref}
          // The image above already prefetches this route; a second prefetch
          // of the same URL only gets cancelled.
          prefetch={false}
          className="border-b border-ink-900 pb-0.5 text-ink-900 outline-offset-4 transition-colors hover:border-ink-400 hover:text-ink-600 focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-900"
        >
          {t.preview}
        </Link>
        <Link
          href={useHref}
          aria-label={t.useOf(primaryName)}
          className="border-b border-transparent pb-0.5 text-ink-500 outline-offset-4 transition-colors hover:border-ink-400 hover:text-ink-900 focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-900"
        >
          {t.use}
        </Link>
      </div>
    </article>
  );
}
