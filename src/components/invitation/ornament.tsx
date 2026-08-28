/**
 * Original hand-drawn SVG flourishes used to add ornamental richness to
 * "ornament"-styled templates (luxury-gold, black-gold, traditional-arabic).
 * Pure vector line-work, colored via `currentColor` — no external assets.
 */

import type { CSSProperties } from "react";

/** A symmetric scrollwork flourish with a small leaf accent, for dividers. */
export function OrnamentFlourish({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 24" className={className} style={style} fill="none" aria-hidden="true">
      <path
        d="M2 12c14 0 18-8 30-8 9 0 12 5 12 8s-3 8-12 8c-12 0-16-8-30-8Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M198 12c-14 0-18-8-30-8-9 0-12 5-12 8s3 8 12 8c12 0 16-8 30-8Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M100 4c4 3 6 5.5 6 8s-2 5-6 8c-4-3-6-5.5-6-8s2-5 6-8Z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="100" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * A quarter-corner floral cluster — curling vine with two small five-petal
 * blooms and leaves. Used on "romantic"-category templates (floral,
 * romantic) instead of the gold scrollwork CornerFlourish. Two colors:
 * the vine/leaves take `currentColor`, the petals take `accent`.
 */
export function FloralCorner({
  className,
  style,
  accent,
}: {
  className?: string;
  style?: CSSProperties;
  accent: string;
}) {
  function Bloom({ cx, cy, r }: { cx: number; cy: number; r: number }) {
    const petals = [0, 72, 144, 216, 288];
    return (
      <g>
        {petals.map((angle) => (
          <ellipse
            key={angle}
            cx={cx}
            cy={cy - r}
            rx={r * 0.62}
            ry={r}
            fill={accent}
            opacity="0.85"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.4} fill="currentColor" opacity="0.9" />
      </g>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className={className} style={style} fill="none" aria-hidden="true">
      <path
        d="M2 30c20 0 26 10 24 26-2 18 8 26 26 24"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path d="M14 12c14 4 18 14 12 24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path
        d="M18 46c6-3 9-8 6-14s-11-8-16-3c4 1 8 5 8 10s-3 6-7 7Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M42 66c-3 6-8 9-14 6s-8-11-3-16c1 4 5 8 10 8s6-3 7-7Z"
        fill="currentColor"
        opacity="0.5"
      />
      <Bloom cx={16} cy={16} r={9} />
      <Bloom cx={46} cy={44} r={6} />
    </svg>
  );
}

/** A quarter-corner leaf-and-vine flourish. Rotate 90/180/270deg to place on any corner. */
export function CornerFlourish({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} fill="none" aria-hidden="true">
      <path
        d="M4 4c30 0 46 4 58 16s16 28 16 58"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.5"
      />
      <path
        d="M4 22c22 0 34 3 43 12s12 21 12 43"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M14 4c3 8 3 13-1 17s-9 4-17 1c3-8 3-13 1-17s9-4 17-1Z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M54 44c5 5 7 9 6 14s-6 8-13 10c-1-7 0-12 3-16s7-6 4-8Z"
        fill="currentColor"
        opacity="0.6"
      />
      <circle cx="4" cy="4" r="3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
