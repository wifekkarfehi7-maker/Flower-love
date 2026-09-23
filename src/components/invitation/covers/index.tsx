"use client";

import type { CSSProperties, ComponentType } from "react";

import { useTranslation } from "@/lib/i18n/use-translation";
import { OpeningExperience } from "../opening-experience";
import { ArchCover } from "./arch";
import { EditorialCover } from "./editorial";
import { MidnightCover } from "./midnight";
import { buildCoverModel, type CoverLayout, type CoverModel } from "./model";
import styles from "./covers.module.css";
import type { InvitationData, TemplateTheme } from "@/types/invitation";

/** The compositions a template can name in `theme.coverLayout`. Anything else keeps the classic cover. */
export const COVER_LAYOUTS: Record<CoverLayout, ComponentType<{ model: CoverModel }>> = {
  editorial: EditorialCover,
  arch: ArchCover,
  midnight: MidnightCover,
};

/*
 * When each opening's veil begins to lift (its fade delay in OpeningExperience).
 * The composition starts revealing at that moment, so the cover crossfades in
 * under the lifting veil instead of leaving an empty beat between the two.
 */
const REVEAL_START: Partial<Record<NonNullable<TemplateTheme["openAnimation"]>, number>> = {
  "minimal-fade": 500,
  "wax-seal": 900,
  envelope: 1150,
  "paper-fold": 1350,
  curtain: 1500,
};

export function isCoverLayout(value: unknown): value is CoverLayout {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(COVER_LAYOUTS, value);
}

/**
 * A named cover composition under the template's own opening experience.
 * The opening is shared and unchanged; the composition's reveal starts as the
 * opening's veil begins to lift (`--cover-start`), and its resting state is
 * always the finished design, so reduced motion simply shows it.
 */
export function LayoutCover({
  layout,
  invitation,
  theme,
  isOpen,
  onOpen,
  monogram,
}: {
  layout: CoverLayout;
  invitation: InvitationData;
  theme: TemplateTheme;
  isOpen: boolean;
  onOpen: () => void;
  monogram: string;
}) {
  const { locale } = useTranslation();
  const Composition = COVER_LAYOUTS[layout];
  // With no opening layer there is nothing to wait for: show the finished composition at once.
  const hasOpening = Boolean(theme.openAnimation && theme.openAnimation !== "classic");

  return (
    <section
      data-cover-layout={layout}
      data-open={isOpen || !hasOpening ? "true" : "false"}
      className={`${styles.cover} relative min-h-[100svh] overflow-hidden`}
      style={{ ["--cover-start" as string]: `${hasOpening ? REVEAL_START[theme.openAnimation!] ?? 1300 : 0}ms` } as CSSProperties}
    >
      <Composition model={buildCoverModel(invitation, theme, locale)} />
      <OpeningExperience theme={theme} isOpen={isOpen} onOpen={onOpen} monogram={monogram} />
    </section>
  );
}
