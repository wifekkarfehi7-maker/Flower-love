"use client";

import * as React from "react";

import { themeCssVars, sectionBackground } from "./theme";
import { CoverSection } from "./sections/cover";
import { InvitationTextSection } from "./sections/invitation-text";
import { FamiliesSection } from "./sections/families";
import { CountdownSection } from "./sections/countdown";
import { EventDetailsSection } from "./sections/event-details";
import { LocationSection } from "./sections/location";
import { CalendarSection } from "./sections/calendar";
import { GallerySection } from "./sections/gallery";
import { RulesSection } from "./sections/rules";
import { RsvpSection } from "./sections/rsvp";
import { FinalMessageSection } from "./sections/final-message";
import { MusicPlayer } from "./music-player";
import type { InvitationData, PageType, TemplateFonts, TemplateTheme } from "@/types/invitation";

const SECTION_COMPONENTS: Record<
  Exclude<PageType, "cover">,
  React.ComponentType<{ invitation: InvitationData; theme: TemplateTheme; isPreview?: boolean }>
> = {
  invitation: InvitationTextSection,
  families: FamiliesSection,
  countdown: CountdownSection,
  event_details: EventDetailsSection,
  location: LocationSection,
  calendar: CalendarSection,
  gallery: GallerySection,
  rules: RulesSection,
  rsvp: RsvpSection,
  final_message: FinalMessageSection,
};

/*
 * One tap, even before hydration. The cover is server-rendered, so on a slow
 * connection a guest can see the seal seconds before React has attached its
 * handlers, and a tap in that window used to do nothing. This inline script
 * runs as the HTML is parsed: it remembers a tap on the cover until the
 * renderer is ready, and the renderer then opens the invitation itself.
 * Once ready (`__flOpenReady`), React handles taps directly and the script
 * records nothing, so a later preview can never inherit a stale tap.
 * About 250 bytes of HTML; no client JavaScript bundle is added for it.
 */
const EARLY_TAP_SCRIPT = `(function(){var c=document.currentScript&&document.currentScript.previousElementSibling;if(c)c.addEventListener("click",function(){if(!window.__flOpenReady)window.__flOpenQueued=true},{capture:true,once:true})})();`;

declare global {
  interface Window {
    __flOpenQueued?: boolean;
    __flOpenReady?: boolean;
  }
}

export function InvitationRenderer({
  invitation,
  theme,
  fonts,
  isPreview = false,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  fonts: TemplateFonts;
  isPreview?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  // A tap that landed before hydration opens the invitation now — no second tap.
  React.useEffect(() => {
    window.__flOpenReady = true;
    if (window.__flOpenQueued) {
      window.__flOpenQueued = false;
      setIsOpen(true);
    }
  }, []);

  const orderedPages = [...invitation.pages]
    .filter((p) => p.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const coverEnabled = orderedPages.some((p) => p.pageType === "cover");
  const restPages = orderedPages.filter((p) => p.pageType !== "cover");

  return (
    <div
      // `data-invitation` scopes the focus ring and ruled-field styles in
      // globals.css to the couple's palette instead of the app's.
      data-invitation=""
      className="min-h-screen w-full"
      style={{ ...themeCssVars(theme, fonts), ...sectionBackground(theme), fontFamily: "var(--inv-font-body)" }}
    >
      {coverEnabled && (
        <CoverSection invitation={invitation} theme={theme} isOpen={isOpen} onOpen={() => setIsOpen(true)} />
      )}
      {/* Must directly follow the cover's <section>: the script listens on its previous sibling. */}
      {coverEnabled && <script dangerouslySetInnerHTML={{ __html: EARLY_TAP_SCRIPT }} />}

      {(isOpen || !coverEnabled) &&
        restPages.map((page) => {
          const Section = SECTION_COMPONENTS[page.pageType as Exclude<PageType, "cover">];
          if (!Section) return null;
          return <Section key={page.pageType} invitation={invitation} theme={theme} isPreview={isPreview} />;
        })}

      {invitation.music && (
        <MusicPlayer
          url={invitation.music.url}
          autoplayAfterOpen={invitation.music.autoplayAfterOpen}
          show={isOpen || !coverEnabled}
          triggerAutoplay={isOpen}
        />
      )}

      {invitation.isWatermarked && <Watermark />}
    </div>
  );
}

/** Visible repeating watermark for invitations on the free plan — removed once the customer upgrades. */
function Watermark() {
  const tile = (
    <span className="whitespace-nowrap font-heading text-xl font-bold tracking-wide">Flower &amp; Love</span>
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden opacity-[0.14] mix-blend-difference"
    >
      <div className="grid h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 -rotate-[30deg] grid-cols-4 gap-x-16 gap-y-20 text-white">
        {Array.from({ length: 40 }).map((_, i) => (
          <React.Fragment key={i}>{tile}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
