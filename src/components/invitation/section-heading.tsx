"use client";

import { Reveal } from "@/components/ui/reveal";
import { FoilSweep } from "./luxury";
import { OrnamentFlourish } from "./ornament";
import type { TemplateTheme } from "@/types/invitation";

/**
 * Every interior section opens the same way a printed page does: a tracked
 * small-caps label, a hairline rule, then the title. Consistent rhythm across
 * sections is what separates a designed piece from a stack of components.
 */
export function SectionHeading({
  title,
  eyebrow,
  theme,
}: {
  title: string;
  eyebrow?: string;
  theme: TemplateTheme;
}) {
  return (
    <Reveal className="flex flex-col items-center">
      {eyebrow && (
        <span
          className="text-[0.55rem] uppercase"
          style={{
            color: "var(--inv-primary)",
            letterSpacing: "var(--inv-track-wide, 0.4em)",
            fontFamily: "var(--inv-font-body)",
            opacity: 0.8,
          }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className="mt-4 text-[1.6rem] leading-tight"
        style={{ fontFamily: "var(--inv-font-heading)", color: "var(--inv-text)", fontWeight: 400, letterSpacing: "0.06em" }}
      >
        {title}
      </h2>
      {theme.dividerStyle === "none" ? (
        <span className="relative mt-5 block h-px w-14" style={{ backgroundColor: "var(--inv-primary)", opacity: 0.4 }}>
          <FoilSweep enabled={theme.foil !== false} />
        </span>
      ) : (
        <span className="relative mt-4 block w-40" style={{ color: "var(--inv-primary)" }}>
          <OrnamentFlourish className="h-4 w-full" />
        </span>
      )}
    </Reveal>
  );
}

/** Generous, even vertical rhythm — printed invitations breathe. */
export function SectionShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative px-8 py-16 text-center ${className}`}>
      <div className="mx-auto w-full max-w-[26rem]">{children}</div>
    </section>
  );
}
