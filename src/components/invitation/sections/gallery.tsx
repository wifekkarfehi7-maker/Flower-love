"use client";

import Image from "next/image";

import { Reveal } from "@/components/ui/reveal";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Divider } from "../divider";
import type { InvitationData, TemplateTheme } from "@/types/invitation";
import { cn } from "@/lib/utils";

const TITLES = { ar: "لحظاتنا", fr: "Nos moments", en: "Our moments" };

export function GallerySection({ invitation, theme }: { invitation: InvitationData; theme: TemplateTheme }) {
  const { locale } = useTranslation();
  if (invitation.gallery.length === 0) return null;

  return (
    <section className="px-6 py-16">
      <Reveal className="text-center">
        <p
          className="text-2xl font-bold sm:text-3xl"
          style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)" }}
        >
          {TITLES[locale]}
        </p>
        <Divider theme={theme} />
      </Reveal>

      <Reveal delay={100} className="mx-auto mt-8 max-w-3xl">
        {theme.galleryLayout === "grid" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {invitation.gallery.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={img.url} alt={img.caption ?? ""} fill className="object-cover" sizes="33vw" />
              </div>
            ))}
          </div>
        )}

        {theme.galleryLayout === "minimal" && (
          <div className="grid grid-cols-2 gap-6">
            {invitation.gallery.map((img) => (
              <div key={img.id} className="relative aspect-[4/5] overflow-hidden">
                <Image src={img.url} alt={img.caption ?? ""} fill className="object-cover" sizes="50vw" />
              </div>
            ))}
          </div>
        )}

        {theme.galleryLayout === "masonry" && (
          <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
            {invitation.gallery.map((img, i) => (
              <div
                key={img.id}
                className="relative overflow-hidden rounded-xl break-inside-avoid"
                style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/5" }}
              >
                <Image src={img.url} alt={img.caption ?? ""} fill className="object-cover" sizes="33vw" />
              </div>
            ))}
          </div>
        )}

        {theme.galleryLayout === "polaroid" && (
          <div className="flex flex-wrap justify-center gap-5">
            {invitation.gallery.map((img, i) => (
              <div
                key={img.id}
                className="w-36 rotate-[var(--r)] bg-white p-2 pb-5 shadow-lg sm:w-44"
                style={{ "--r": `${(i % 2 === 0 ? -1 : 1) * (3 + (i % 3))}deg` } as React.CSSProperties}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image src={img.url} alt={img.caption ?? ""} fill className="object-cover" sizes="200px" />
                </div>
              </div>
            ))}
          </div>
        )}

        {theme.galleryLayout === "romantic" && (
          <div className="relative flex flex-wrap justify-center gap-2 py-4">
            {invitation.gallery.map((img, i) => (
              <div
                key={img.id}
                className={cn(
                  "relative aspect-[3/4] w-28 overflow-hidden rounded-[1.5rem] border-4 shadow-xl sm:w-36",
                  i % 2 === 0 ? "translate-y-0" : "translate-y-6"
                )}
                style={{ borderColor: "var(--inv-surface)" }}
              >
                <Image src={img.url} alt={img.caption ?? ""} fill className="object-cover" sizes="200px" />
              </div>
            ))}
          </div>
        )}

        {theme.galleryLayout === "carousel" && (
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2">
            {invitation.gallery.map((img) => (
              <div
                key={img.id}
                className="relative aspect-[3/4] w-56 shrink-0 snap-center overflow-hidden rounded-2xl"
              >
                <Image src={img.url} alt={img.caption ?? ""} fill className="object-cover" sizes="224px" />
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
