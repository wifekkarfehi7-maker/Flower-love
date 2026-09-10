import type { CSSProperties } from "react";

import type { TemplateTheme } from "@/types/invitation";

/**
 * Original line-art ornament systems, drawn to sit at the corners of an
 * invitation the way engraved botanicals sit on printed stationery: fine
 * strokes, a single sweeping stem, weight concentrated at one end.
 *
 * `currentColor` carries the stem/leaf line work; `accent` carries the petals,
 * so each ornament reads as two inks rather than one flat silhouette.
 */

type OrnamentProps = {
  className?: string;
  style?: CSSProperties;
  accent: string;
};

/** Layered five-petal bloom — the shared flower primitive. */
function Bloom({ cx, cy, r, accent, petals = 5 }: { cx: number; cy: number; r: number; accent: string; petals?: number }) {
  const angles = Array.from({ length: petals }, (_, i) => (360 / petals) * i);
  return (
    <g>
      {angles.map((a) => (
        <ellipse
          key={`o${a}`}
          cx={cx}
          cy={cy - r * 0.62}
          rx={r * 0.42}
          ry={r * 0.66}
          fill={accent}
          opacity="0.5"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      {angles.map((a) => (
        <ellipse
          key={`i${a}`}
          cx={cx}
          cy={cy - r * 0.4}
          rx={r * 0.26}
          ry={r * 0.42}
          fill={accent}
          opacity="0.75"
          transform={`rotate(${a + 36} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.18} fill="currentColor" opacity="0.8" />
    </g>
  );
}

/** Almond leaf with a centre vein. */
function Leaf({ x, y, len, rot, flip = false }: { x: number; y: number; len: number; rot: number; flip?: boolean }) {
  const w = len * 0.38;
  return (
    <g transform={`rotate(${rot} ${x} ${y}) ${flip ? `scale(1,-1) translate(0 ${-2 * y})` : ""}`}>
      <path
        d={`M${x} ${y} C ${x + len * 0.3} ${y - w}, ${x + len * 0.75} ${y - w * 0.8}, ${x + len} ${y} C ${x + len * 0.75} ${y + w * 0.8}, ${x + len * 0.3} ${y + w}, ${x} ${y} Z`}
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d={`M${x} ${y} C ${x + len * 0.3} ${y - w}, ${x + len * 0.75} ${y - w * 0.8}, ${x + len} ${y}`}
        stroke="currentColor"
        strokeWidth="0.9"
        fill="none"
        opacity="0.65"
      />
      <path d={`M${x + 2} ${y} L ${x + len - 2} ${y}`} stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    </g>
  );
}

/** Peonies and roses on a long stem — burgundy/wine direction. */
function RoseCorner({ className, style, accent }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} fill="none" aria-hidden="true">
      <path d="M4 96 C 42 96, 66 74, 80 44 C 90 22, 104 10, 128 6" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
      <path d="M10 62 C 40 66, 58 54, 70 30" stroke="currentColor" strokeWidth="0.9" opacity="0.35" />
      <path d="M22 122 C 52 116, 70 96, 78 70" stroke="currentColor" strokeWidth="0.9" opacity="0.35" />
      <Leaf x={30} y={92} len={30} rot={-24} />
      <Leaf x={52} y={70} len={26} rot={-58} />
      <Leaf x={70} y={104} len={24} rot={18} />
      <Leaf x={96} y={30} len={22} rot={-72} />
      <Bloom cx={26} cy={40} r={19} accent={accent} />
      <Bloom cx={62} cy={22} r={12} accent={accent} />
      <Bloom cx={16} cy={78} r={10} accent={accent} />
      <circle cx={84} cy={54} r="2.4" fill={accent} opacity="0.8" />
      <circle cx={94} cy={66} r="1.8" fill={accent} opacity="0.6" />
      <circle cx={44} cy={62} r="2" fill={accent} opacity="0.7" />
    </svg>
  );
}

/** Olive branch with berries — sage/olive direction. */
function OliveCorner({ className, style, accent }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} fill="none" aria-hidden="true">
      <path d="M2 30 C 40 40, 74 62, 96 104 C 108 126, 116 146, 118 168" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
      <path d="M14 16 C 44 34, 62 54, 72 82" stroke="currentColor" strokeWidth="0.8" opacity="0.32" />
      <Leaf x={22} y={36} len={26} rot={28} />
      <Leaf x={22} y={36} len={22} rot={-16} flip />
      <Leaf x={48} y={54} len={28} rot={40} />
      <Leaf x={48} y={54} len={23} rot={-4} flip />
      <Leaf x={74} y={82} len={27} rot={54} />
      <Leaf x={74} y={82} len={22} rot={12} flip />
      <Leaf x={96} y={116} len={24} rot={68} />
      <Leaf x={104} y={144} len={20} rot={78} />
      <circle cx={40} cy={40} r="3" fill={accent} opacity="0.75" />
      <circle cx={66} cy={68} r="2.6" fill={accent} opacity="0.65" />
      <circle cx={90} cy={104} r="3.2" fill={accent} opacity="0.7" />
      <circle cx={110} cy={140} r="2.4" fill={accent} opacity="0.6" />
    </svg>
  );
}

/** Orchid-and-pearl spray — ivory/pearl direction. */
function PearlCorner({ className, style, accent }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} fill="none" aria-hidden="true">
      <path d="M0 44 C 36 48, 62 64, 84 92 C 98 110, 106 128, 108 150" stroke="currentColor" strokeWidth="0.9" opacity="0.4" />
      <path d="M6 18 C 30 30, 50 44, 62 64" stroke="currentColor" strokeWidth="0.7" opacity="0.28" />
      <Leaf x={34} y={54} len={30} rot={34} />
      <Leaf x={62} y={78} len={26} rot={52} />
      <Leaf x={20} y={30} len={24} rot={16} />
      <Bloom cx={22} cy={64} r={17} accent={accent} petals={6} />
      <Bloom cx={58} cy={38} r={13} accent={accent} petals={6} />
      <Bloom cx={88} cy={116} r={10} accent={accent} petals={6} />
      {[
        [44, 76, 2.6],
        [52, 88, 2],
        [62, 100, 2.4],
        [72, 112, 1.8],
        [80, 128, 2.2],
        [38, 22, 2],
        [48, 14, 1.6],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#ffffff" opacity="0.85" stroke={accent} strokeWidth="0.4" />
      ))}
    </svg>
  );
}

/** Interlaced eight-point geometry — Arabian royal direction. */
function ArabesqueCorner({ className, style, accent }: OrnamentProps) {
  const star = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} fill="none" aria-hidden="true">
      {/* interlaced eight-point rosette */}
      <g transform="translate(52 52)">
        {star.slice(0, 4).map((a) => (
          <rect
            key={a}
            x="-26"
            y="-26"
            width="52"
            height="52"
            stroke={accent}
            strokeWidth="0.9"
            opacity="0.42"
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="9" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        <circle r="3" fill={accent} opacity="0.6" />
      </g>
      {/* tendrils running out along the two edges */}
      <path d="M52 96 C 52 128, 68 146, 96 152" stroke="currentColor" strokeWidth="0.9" opacity="0.42" />
      <path d="M96 52 C 128 52, 146 68, 152 96" stroke="currentColor" strokeWidth="0.9" opacity="0.42" />
      <path d="M52 108 C 60 128, 74 138, 92 140" stroke="currentColor" strokeWidth="0.6" opacity="0.26" />
      <path d="M108 52 C 128 60, 138 74, 140 92" stroke="currentColor" strokeWidth="0.6" opacity="0.26" />
      {[
        [104, 158],
        [158, 104],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(45)`}>
          <rect x="-7" y="-7" width="14" height="14" stroke={accent} strokeWidth="0.7" opacity="0.42" />
          <circle r="2" fill={accent} opacity="0.55" />
        </g>
      ))}
    </svg>
  );
}

const CORNER_VARIANTS = {
  "rose-burgundy": RoseCorner,
  "olive-branch": OliveCorner,
  "pearl-bloom": PearlCorner,
  arabesque: ArabesqueCorner,
  floral: RoseCorner,
} as const;

export function BotanicalCorner({
  variant,
  className,
  style,
  accent,
}: OrnamentProps & { variant: NonNullable<TemplateTheme["decorativeStyle"]> }) {
  const Corner = CORNER_VARIANTS[variant] ?? RoseCorner;
  return <Corner className={className} style={style} accent={accent} />;
}

/** Hairline rule with a small centred lozenge — the section divider. */
export function OrnamentFlourish({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 240 16" className={className} style={style} fill="none" aria-hidden="true">
      <path d="M6 8 L 100 8" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <path d="M140 8 L 234 8" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <path d="M108 8 L 120 2 L 132 8 L 120 14 Z" stroke="currentColor" strokeWidth="0.8" opacity="0.75" />
      <circle cx="120" cy="8" r="1.4" fill="currentColor" opacity="0.9" />
      <circle cx="102" cy="8" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="138" cy="8" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
