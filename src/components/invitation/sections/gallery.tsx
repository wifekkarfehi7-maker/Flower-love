"use client";

import Image from "next/image";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "../section-heading";
import { radiusClass } from "../theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { GalleryImageItem, InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: { title: "لحظاتنا", eyebrow: "من ألبومنا", scroll: "معرض الصور — مرّروا أفقياً" },
  fr: { title: "Nos moments", eyebrow: "Notre album", scroll: "Galerie — faites défiler horizontalement" },
  en: { title: "Our Moments", eyebrow: "From our album", scroll: "Gallery — scroll horizontally" },
};

/**
 * Photographs are mounted, not floated: a hairline rule in the template's
 * primary stands in for a print mat, so images sit inside the stationery
 * instead of hovering over it on a drop shadow.
 */
function Plate({
  image,
  className,
  sizes,
  radius,
  style,
}: {
  image: GalleryImageItem;
  className?: string;
  sizes: string;
  radius: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("relative overflow-hidden", radius, className)} style={style}>
      <Image src={image.url} alt={image.caption ?? ""} fill className="object-cover" sizes={sizes} />
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 border", radius)}
        style={{ borderColor: "var(--inv-primary)", opacity: 0.35 }}
      />
    </div>
  );
}

export function GallerySection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  if (invitation.gallery.length === 0) return null;

  const radius = radiusClass(theme.cardRadius);

  return (
    <SectionShell>
      <SectionHeading title={t.title} eyebrow={t.eyebrow} theme={theme} />

      <Reveal delay={110} className="mt-11">
        {theme.galleryLayout === "grid" && (
          <div className="grid grid-cols-2 gap-2.5">
            {invitation.gallery.map((img) => (
              <Plate key={img.id} image={img} className="aspect-square" sizes="50vw" radius={radius} />
            ))}
          </div>
        )}

        {theme.galleryLayout === "minimal" && (
          <div className="grid grid-cols-2 gap-5">
            {invitation.gallery.map((img) => (
              <Plate key={img.id} image={img} className="aspect-[4/5]" sizes="50vw" radius="rounded-none" />
            ))}
          </div>
        )}

        {theme.galleryLayout === "masonry" && (
          <div className="columns-2 gap-2.5 [&>*]:mb-2.5">
            {invitation.gallery.map((img, i) => (
              <Plate
                key={img.id}
                image={img}
                className="break-inside-avoid"
                style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/5" }}
                sizes="50vw"
                radius={radius}
              />
            ))}
          </div>
        )}

        {theme.galleryLayout === "polaroid" && (
          <div className="flex flex-wrap justify-center gap-5">
            {invitation.gallery.map((img, i) => (
              <div
                key={img.id}
                className="w-36 p-2 pb-6 shadow-sm"
                style={{
                  transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (2 + (i % 3))}deg)`,
                  backgroundColor: "var(--inv-surface)",
                }}
              >
                <Plate image={img} className="aspect-square" sizes="150px" radius="rounded-none" />
              </div>
            ))}
          </div>
        )}

        {theme.galleryLayout === "romantic" && (
          <div className="flex flex-wrap items-start justify-center gap-3">
            {invitation.gallery.map((img, i) => (
              <Plate
                key={img.id}
                image={img}
                className={cn("aspect-[3/4] w-28", i % 2 === 0 ? "translate-y-0" : "translate-y-5")}
                sizes="120px"
                radius={radius}
              />
            ))}
          </div>
        )}

        {theme.galleryLayout === "carousel" && (
          <div
            // Focusable so a keyboard can reach and scroll the overflow region.
            tabIndex={0}
            role="group"
            aria-label={t.scroll}
            className="-mx-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-8 pb-2"
          >
            {invitation.gallery.map((img) => (
              <Plate
                key={img.id}
                image={img}
                className="aspect-[3/4] w-48 shrink-0 snap-center"
                sizes="200px"
                radius={radius}
              />
            ))}
          </div>
        )}
      </Reveal>
    </SectionShell>
  );
}
