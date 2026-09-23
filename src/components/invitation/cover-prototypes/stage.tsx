"use client";

import * as React from "react";

import { STATIC_TEMPLATES } from "@/lib/templates/static-templates";
import { DEMO_INVITATION } from "@/lib/templates/demo-invitation";
import { useTranslation } from "@/lib/i18n/use-translation";
import { OpeningExperience } from "../opening-experience";
import { MusicPlayer } from "../music-player";
import { formatDateParts } from "../date-parts";
import { sectionBackground, themeCssVars } from "../theme";
import { EditorialCover } from "./editorial-cover";
import { ArchCover } from "./arch-cover";
import { MidnightCover } from "./midnight-cover";
import type { CoverModel, PrototypeLayout } from "./model";
import styles from "./prototypes.module.css";

/*
 * P2 prototype stage. It stands in for what `sections/cover.tsx` would become:
 * build one view model, hand it to the composition the template names, keep
 * the opening experience shared. Nothing in the live renderer imports this.
 */

/** Which real template each prototype dresses, and which demo photo it leads with. */
const PROTOTYPES: Record<PrototypeLayout, { slug: string; galleryIndex: number | null; Cover: React.ComponentType<{ model: CoverModel }> }> = {
  editorial: { slug: "modern", galleryIndex: 4, Cover: EditorialCover },
  arch: { slug: "traditional-arabic", galleryIndex: null, Cover: ArchCover },
  midnight: { slug: "black-gold", galleryIndex: 2, Cover: MidnightCover },
};

const STRINGS = {
  ar: {
    masthead: "دعوة زفاف",
    eyebrow: "بمشيئة الله وبمباركة العائلتين",
    invite: "يسعدنا حضوركم للاحتفال بزفاف",
    and: "و",
    dateLabel: "التاريخ",
    venueLabel: "المكان",
    timeLabel: "الساعة",
  },
  fr: {
    masthead: "Faire-part de mariage",
    eyebrow: "Avec la bénédiction de leurs familles",
    invite: "Vous êtes conviés au mariage de",
    and: "&",
    dateLabel: "Date",
    venueLabel: "Lieu",
    timeLabel: "Heure",
  },
  en: {
    masthead: "Wedding invitation",
    eyebrow: "Together with their families",
    invite: "Invite you to celebrate the wedding of",
    and: "&",
    dateLabel: "Date",
    venueLabel: "Venue",
    timeLabel: "Time",
  },
};

/**
 * The demo gallery is stored at 1200px wide, which is right for the gallery
 * grid but too small for a full-height cover column: a landscape frame cropped
 * to 600×1600 would be upscaled 2×. The prototype asks Unsplash for the same
 * photograph at 2400px. A couple's own upload goes through untouched.
 */
function demoSource(url: string | undefined): string | null {
  if (!url) return null;
  return url.includes("images.unsplash.com") ? url.replace(/([?&])w=\d+/, "$1w=2400") : url;
}

/*
 * One tap, even before hydration. The cover is server-rendered, so a guest on
 * a slow connection sees the seal before React has attached its handlers; a
 * tap in that window would otherwise do nothing and need repeating. This
 * inline script runs as the HTML is parsed, notes the first tap on the cover,
 * and the stage opens as soon as it hydrates. Once hydrated it has nothing
 * left to do: React's own handler opens the invitation directly.
 */
const EARLY_TAP_SCRIPT = `(function(){var s=document.currentScript.previousElementSibling;if(!s)return;s.addEventListener("click",function(){window.__flOpenQueued=true;},{capture:true,once:true});})();`;

declare global {
  interface Window {
    __flOpenQueued?: boolean;
  }
}

function initialsOf(a: string, b: string) {
  return `${(a.trim()[0] ?? "").toUpperCase()}${(b.trim()[0] ?? "").toUpperCase()}` || "&";
}

export function CoverPrototypeStage({
  layout,
  startOpen,
  withPhoto,
  musicUrl = null,
}: {
  layout: PrototypeLayout;
  startOpen: boolean;
  withPhoto: boolean;
  /** Same-origin track for exercising the music path exactly as the renderer mounts it. */
  musicUrl?: string | null;
}) {
  const { locale } = useTranslation();
  const { slug, galleryIndex, Cover } = PROTOTYPES[layout];
  const template = STATIC_TEMPLATES.find((t) => t.slug === slug)!;
  const invitation = DEMO_INVITATION;
  const [isOpen, setIsOpen] = React.useState(startOpen);
  // Opened on arrival: the composition's own motion starts at once. Opened by
  // the guest: it waits for the seal or the veil to clear first.
  const [start] = React.useState(startOpen ? 0 : 1300);

  // A tap that landed before hydration opens the invitation now, without a second one.
  React.useEffect(() => {
    if (window.__flOpenQueued) {
      window.__flOpenQueued = false;
      setIsOpen(true);
    }
  }, []);

  const [y, m, d] = (invitation.weddingDate ?? "").split("-");
  const firstEvent = invitation.events[0];
  const model: CoverModel = {
    locale,
    t: STRINGS[locale],
    groom: invitation.groomName,
    bride: invitation.brideName,
    date: formatDateParts(invitation.weddingDate, locale),
    folio: y && m && d ? `${d}.${m}.${y}` : null,
    time: invitation.weddingTime ?? firstEvent?.time ?? null,
    venue: firstEvent?.locationName ?? null,
    image: !withPhoto ? null : invitation.coverImageUrl ?? (galleryIndex !== null ? demoSource(invitation.gallery[galleryIndex]?.url) : null),
    theme: template.theme,
  };

  return (
    <div
      data-invitation=""
      data-open={isOpen ? "true" : "false"}
      className={`${styles.stage} min-h-screen w-full`}
      style={{
        ...themeCssVars(template.theme, template.fonts),
        ...sectionBackground(template.theme),
        fontFamily: "var(--inv-font-body)",
        ["--p2-start" as string]: `${start}ms`,
      }}
    >
      <section className="relative min-h-[100svh] overflow-hidden">
        <Cover model={model} />
        <OpeningExperience
          theme={template.theme}
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
          monogram={initialsOf(invitation.groomName, invitation.brideName)}
        />
      </section>
      <script dangerouslySetInnerHTML={{ __html: EARLY_TAP_SCRIPT }} />

      {musicUrl && <MusicPlayer url={musicUrl} autoplayAfterOpen show={isOpen} triggerAutoplay={isOpen} />}
    </div>
  );
}
