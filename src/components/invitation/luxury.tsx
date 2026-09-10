"use client";

import type { CSSProperties } from "react";

import { textureLayer } from "./theme";
import type { TemplateTheme } from "@/types/invitation";

/**
 * Shared "physical stationery" primitives: sealing wax, printed borders,
 * material grain and the slow highlight that makes metallic ink read as foil.
 */

/**
 * Sealing wax. Built from two offset organic blobs so the edge reads as poured
 * rather than drawn, a pressed rim, and an embossed monogram.
 */
export function WaxSeal({
  color,
  monogram,
  size = 74,
  broken = false,
  idle = true,
  className,
}: {
  color: string;
  monogram: string;
  size?: number;
  /** Splits the seal in two and lets the halves fall away. */
  broken?: boolean;
  /** Slow breathing while the seal is intact, to invite the tap. */
  idle?: boolean;
  className?: string;
}) {
  const half = (side: "left" | "right"): CSSProperties => ({
    clipPath: side === "left" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
    transformOrigin: side === "left" ? "88% 50%" : "12% 50%",
    transform: broken
      ? `translate(${side === "left" ? "-58%" : "58%"}, 64%) rotate(${side === "left" ? "-48deg" : "48deg"}) scale(0.82)`
      : "translate(0,0) rotate(0deg) scale(1)",
    opacity: broken ? 0 : 1,
    transitionProperty: "transform, opacity",
    transitionDuration: "900ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
    transitionDelay: side === "right" ? "60ms" : "0ms",
  });

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        animation: idle && !broken ? "seal-breathe 4.2s ease-in-out infinite" : undefined,
      }}
    >
      {/* wax that squeezed out under pressure — deliberately off-centre */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "58% 42% 47% 53% / 44% 56% 41% 59%",
          background: `color-mix(in srgb, ${color} 86%, #000000)`,
          opacity: broken ? 0 : 0.38,
          filter: "blur(0.4px)",
          transform: "rotate(-8deg)",
          transition: "opacity 500ms ease",
        }}
      />
      {(["left", "right"] as const).map((side) => (
        <span
          key={side}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "52% 48% 44% 56% / 46% 55% 45% 54%",
            /* Matte wax: a broad soft sheen, not a specular dot — sealing wax
               scatters light rather than reflecting it. */
            backgroundImage: `radial-gradient(ellipse 130% 100% at 36% 24%, color-mix(in srgb, ${color} 92%, #ffffff), ${color} 46%, color-mix(in srgb, ${color} 66%, #000000) 100%)`,
            boxShadow: `inset 0 -6px 10px rgba(0,0,0,0.42), inset 0 2px 3px rgba(255,255,255,0.07), inset 0 0 0 1px color-mix(in srgb, ${color} 60%, #000000), inset 0 0 0 6px color-mix(in srgb, ${color} 82%, #000000), 0 4px 12px -4px rgba(0,0,0,0.6)`,
            ...half(side),
          }}
        />
      ))}
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          /* Cinzel has no Arabic, so Amiri catches Arabic initials behind it. */
          fontFamily: "var(--font-cinzel), var(--font-amiri), serif",
          fontSize: size * 0.28,
          letterSpacing: "0.04em",
          /* Struck into the wax: dark impression, light catching its lower lip. */
          color: `color-mix(in srgb, ${color} 48%, #000000)`,
          textShadow: `0 1px 0.5px color-mix(in srgb, ${color} 78%, #ffffff), 0 -1px 1px rgba(0,0,0,0.5)`,
          opacity: broken ? 0 : 0.95,
          transition: "opacity 320ms ease",
        }}
      >
        {monogram}
      </span>
    </span>
  );
}

/**
 * The printed border. Strokes use `vector-effect: non-scaling-stroke` so a
 * hairline stays a hairline no matter how the frame is stretched.
 */
export function FrameBorder({
  style,
  color,
  className,
}: {
  style: NonNullable<TemplateTheme["frameStyle"]>;
  color: string;
  className?: string;
}) {
  const common = {
    stroke: color,
    fill: "none" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {style === "hairline" && <rect x="0.5" y="0.5" width="99" height="99" strokeWidth="1" opacity="0.42" {...common} />}

      {style === "double-rule" && (
        <>
          <rect x="0.5" y="0.5" width="99" height="99" strokeWidth="1.2" opacity="0.5" {...common} />
          <rect x="2.2" y="2.2" width="95.6" height="95.6" strokeWidth="0.6" opacity="0.3" {...common} />
        </>
      )}

      {style === "ornate-corner" && (
        <>
          <rect x="0.5" y="0.5" width="99" height="99" strokeWidth="0.9" opacity="0.4" {...common} />
          <path d="M0.5 8 L0.5 0.5 L8 0.5" strokeWidth="2.4" opacity="0.75" {...common} />
          <path d="M92 0.5 L99.5 0.5 L99.5 8" strokeWidth="2.4" opacity="0.75" {...common} />
          <path d="M0.5 92 L0.5 99.5 L8 99.5" strokeWidth="2.4" opacity="0.75" {...common} />
          <path d="M92 99.5 L99.5 99.5 L99.5 92" strokeWidth="2.4" opacity="0.75" {...common} />
        </>
      )}

      {style === "arch" && (
        <>
          <path
            d="M2 99 L2 34 C2 15, 22 2, 50 2 C78 2, 98 15, 98 34 L98 99"
            strokeWidth="1.2"
            opacity="0.5"
            {...common}
          />
          <path
            d="M4.5 99 L4.5 35 C4.5 17.5, 23.5 5, 50 5 C76.5 5, 95.5 17.5, 95.5 35 L95.5 99"
            strokeWidth="0.5"
            opacity="0.28"
            {...common}
          />
        </>
      )}
    </svg>
  );
}

/** Material grain for the section background. Always sub-5% opacity. */
export function TextureOverlay({ texture, tint }: { texture: TemplateTheme["texture"]; tint: string }) {
  const layer = textureLayer(texture, tint);
  if (!layer) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ ...layer, mixBlendMode: "overlay", opacity: 0.9 }}
    />
  );
}

/**
 * A slow highlight travelling across metallic ink. Wrap gold text or rules in
 * this; the sweep is deliberately faint — noticeable only if you watch for it.
 */
export function FoilSweep({ enabled = true, delay = 0 }: { enabled?: boolean; delay?: number }) {
  if (!enabled) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(104deg, transparent 38%, rgba(255,255,255,0.34) 47%, rgba(255,255,255,0.06) 54%, transparent 62%)",
        backgroundSize: "260% 100%",
        mixBlendMode: "soft-light",
        animation: `foil-travel 7.5s ${delay}ms cubic-bezier(0.45,0,0.55,1) infinite`,
      }}
    />
  );
}
