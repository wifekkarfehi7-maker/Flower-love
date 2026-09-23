import { at, type CoverModel } from "./model";
import styles from "./covers.module.css";

/*
 * The arch is drawn in a 200 × 400 box. A horseshoe: the dome's circle is
 * wider than the jambs, so the opening narrows where the arc meets them —
 * the Kairouan and Tunis medina doorway, not a Gothic point or a Roman half-round.
 */
const INNER = "M26 400 L26 139.75 A84 84 0 1 1 174 139.75 L174 400";

/* The same outlines as halves, each drawn from the ground up so the two jambs rise and meet at the apex. */
const HALVES = [
  { d: "M20 400 L20 141 A90 90 0 0 1 100 10", w: 0.9, o: 0.9, t: 0 },
  { d: "M180 400 L180 141 A90 90 0 0 0 100 10", w: 0.9, o: 0.9, t: 0 },
  { d: "M26 400 L26 139.75 A84 84 0 0 1 100 16", w: 0.45, o: 0.55, t: 250 },
  { d: "M174 400 L174 139.75 A84 84 0 0 0 100 16", w: 0.45, o: 0.55, t: 250 },
];

/** Eight-pointed star (two squares), the keystone at the apex. */
function Star({ cx, cy, r, fill, className }: { cx: number; cy: number; r: number; fill: string; className?: string }) {
  const s = r * 0.72;
  return (
    <g className={className} stroke="currentColor" strokeWidth="0.6" fill={fill}>
      <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} />
      <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} transform={`rotate(45 ${cx} ${cy})`} />
    </g>
  );
}

/**
 * Arabic luxury — architectural and centred. One doorway, drawn in brass
 * hairline on night blue; the names stand inside it, the date waits on the
 * threshold beneath a row of door studs. No photograph: the architecture is
 * the image, so it looks the same whether or not the couple uploads one.
 */
export function ArchCover({ model }: { model: CoverModel }) {
  const { t, date, theme } = model;

  return (
    <div className={styles.arch}>
      <div className={styles.archFrame}>
        <svg viewBox="0 0 200 400" aria-hidden="true" style={{ color: "var(--inv-primary)" }}>
          <path d={INNER} fill="var(--inv-surface)" fillOpacity="0.6" stroke="none" className={styles.fadeSlow} style={at(1600)} />
          {/* The threshold is laid first, from the centre outward. */}
          <path d="M100 400 L4 400" pathLength={1} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.7" className={styles.draw} style={at(0)} />
          <path d="M100 400 L196 400" pathLength={1} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.7" className={styles.draw} style={at(0)} />
          {HALVES.map((h) => (
            <path key={h.d} d={h.d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={h.w} opacity={h.o} className={styles.draw} style={at(300 + h.t)} />
          ))}
          {/* The keystone goes in last, once the two sides have met. */}
          <g className={styles.fade} style={at(3000)}>
            <Star cx={100} cy={10} r={7} fill={theme.background} />
          </g>
        </svg>

        <div className={styles.archContent}>
          <p className={`${styles.label} ${styles.fade}`} style={at(1200)}>
            {t.eyebrow}
          </p>
          <svg viewBox="0 0 20 20" aria-hidden="true" className={`${styles.archStar} ${styles.fade}`} style={at(1300)}>
            <Star cx={10} cy={10} r={9} fill="none" />
          </svg>
          <p className={`${styles.label} ${styles.fade}`} style={at(1400)}>
            {t.invite}
          </p>

          <h1 className="mt-[5cqw]">
            <span className={`${styles.archName} ${styles.fade} block`} style={at(1600)}>
              {model.groom}
            </span>
            <span className={`${styles.archAnd} ${styles.fade} block`} style={at(1850)}>
              {t.and}
            </span>
            <span className={`${styles.archName} ${styles.fade} block`} style={at(2000)}>
              {model.bride}
            </span>
          </h1>
        </div>
      </div>

      <div aria-hidden="true" className={`${styles.studs} ${styles.fade}`} style={at(1000)}>
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      {date && (
        <p className={`${styles.archDate} ${styles.fade}`} style={at(2300)}>
          {date.weekday} {date.dayOfMonth} {date.month} {date.year}
        </p>
      )}
      {(model.time || model.venue) && (
        <p className={`${styles.archDetails} ${styles.label} ${styles.fade}`} style={at(2450)}>
          {model.time && <span className={styles.figures}>{model.time}</span>}
          {model.time && model.venue && " · "}
          {model.venue}
        </p>
      )}
    </div>
  );
}
