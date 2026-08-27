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

  const orderedPages = [...invitation.pages]
    .filter((p) => p.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const coverEnabled = orderedPages.some((p) => p.pageType === "cover");
  const restPages = orderedPages.filter((p) => p.pageType !== "cover");

  return (
    <div
      className="min-h-screen w-full"
      style={{ ...themeCssVars(theme, fonts), ...sectionBackground(theme), fontFamily: "var(--inv-font-body)" }}
    >
      {coverEnabled && (
        <CoverSection invitation={invitation} theme={theme} isOpen={isOpen} onOpen={() => setIsOpen(true)} />
      )}

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
