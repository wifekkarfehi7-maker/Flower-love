import Image from "next/image";

import { at, type CoverModel } from "./model";
import styles from "./prototypes.module.css";

/**
 * Midnight — a film's title card. The photograph fills the screen, graded
 * down toward black and white; a champagne masthead at the head, and the
 * names low in the frame where the picture has gone to black, followed by
 * the date and the credits. Without a photograph it is a black title card.
 */
export function MidnightCover({ model }: { model: CoverModel }) {
  const { t, date } = model;

  return (
    <div className={styles.midnight} data-photo={model.image ? "true" : "false"}>
      {model.image && (
        <div aria-hidden="true" className={styles.mnPhoto}>
          <div className={`absolute inset-0 ${styles.push}`} style={at(0)}>
            <Image src={model.image} alt="" fill priority sizes="(max-aspect-ratio: 2/3) 67vh, 100vw" />
          </div>
          <div className={styles.mnScrim} />
        </div>
      )}

      <header className={`${styles.mnTop} ${styles.fade}`} style={at(900)}>
        <span className={styles.mnMasthead}>{t.masthead}</span>
        <span aria-hidden="true" className={styles.mnDrop} />
      </header>

      <div className={styles.mnBottom}>
        <p className={`${styles.label} ${styles.fade}`} style={at(1300)}>
          {t.invite}
        </p>
        <h1 className={styles.mnNames}>
          <span className={styles.lineMask}>
            <span className={styles.line} style={at(1500)}>
              {model.groom}
              <span className={styles.mnAnd}>{t.and}</span>
              {model.bride}
            </span>
          </span>
        </h1>

        {model.folio && (
          <p className={`${styles.mnFolio} ${styles.figures} ${styles.fade}`} style={at(2100)}>
            {model.folio}
          </p>
        )}
        <p className={`${styles.mnCredits} ${styles.fade}`} style={at(2300)}>
          {date && <span>{date.weekday}</span>}
          {/* The rule sits on the outer span: inside the isolated LTR run it would land on the wrong side. */}
          {model.time && (
            <span>
              <span className={styles.figures}>{model.time}</span>
            </span>
          )}
          {model.venue && <span>{model.venue}</span>}
        </p>
      </div>
    </div>
  );
}
