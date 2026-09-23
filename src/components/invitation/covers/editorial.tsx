import Image from "next/image";

import { at, type CoverModel } from "./model";
import styles from "./covers.module.css";

/**
 * Editorial — a magazine opener rather than a card. Asymmetric: the groom's
 * name set flush to the start, one photograph held to the end side, the
 * bride's name answering from the far edge, and the practical facts filed as
 * credits at the foot. On a wide screen it becomes a spread: type on one
 * page, the photograph bleeding off the other.
 */
export function EditorialCover({ model }: { model: CoverModel }) {
  const { t, date } = model;

  return (
    <div className={styles.editorial}>
      <header className={`${styles.edFolio} ${styles.fade}`} style={at(0)}>
        <span className={styles.label}>{t.masthead}</span>
        <span aria-hidden="true" className={styles.hairline} />
        {model.folio && <span className={styles.figures}>{model.folio}</span>}
      </header>

      <p className={`${styles.edLead} ${styles.label} ${styles.fade}`} style={at(200)}>
        {t.eyebrow}
        {model.locale === "ar" ? "، " : ", "}
        {t.invite}
      </p>

      <h1 className={`${styles.edName} ${styles.edGroom}`}>
        <span className={styles.lineMask}>
          <span className={styles.line} style={at(350)}>
            {model.groom}
          </span>
        </span>
      </h1>

      <span className={`${styles.edAnd} ${styles.fade}`} style={at(900)}>
        {t.and}
      </span>

      <figure className={`${styles.edPhoto} ${styles.maskReveal}`} style={at(150)}>
        {model.image ? (
          /* `sizes` must cover the crop, not the box: a 3:2 frame filling a tall column
               needs ~1.5× the column's height in width, or the browser picks a file half the size it needs. */
            <Image src={model.image} alt="" fill priority sizes="(min-width: 900px) 150vh, 170vw" />
        ) : (
          date && (
            <div className={styles.edNumeral} aria-hidden="true">
              <span className={styles.figures}>{date.day}</span>
              <span className={styles.label}>
                {date.month} {date.year}
              </span>
            </div>
          )
        )}
      </figure>

      <p className={`${styles.edName} ${styles.edBride}`}>
        <span className={styles.lineMask}>
          <span className={styles.line} style={at(550)}>
            {model.bride}
          </span>
        </span>
      </p>

      <dl className={`${styles.edCredits} ${styles.fade}`} style={at(1100)}>
        {date && (
          <div>
            <dt>{t.dateLabel}</dt>
            <dd>
              {date.weekday} {date.dayOfMonth} {date.month}
            </dd>
          </div>
        )}
        {model.venue && (
          <div>
            <dt>{t.venueLabel}</dt>
            <dd>{model.venue}</dd>
          </div>
        )}
        {model.time && (
          <div>
            <dt>{t.timeLabel}</dt>
            <dd className={styles.figures}>{model.time}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
