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
import { RsvpSection } from "./sections/rsvp";
import { FinalMessageSection } from "./sections/final-message";
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
    </div>
  );
}
