import { useState } from 'react';
import type { ReactElement } from 'react';
import Lightbox from './Lightbox.tsx';
import styles from './ScreenshotGallery.module.css';

// Astro exposes the configured `base` here (no guaranteed trailing slash --
// this build emits `/swatchbook`); captured screenshots live in `public/media/`
// (regenerated on deploy, see scripts/capture-media.mjs) so the URL needs the
// same prefix every other asset gets.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const SHOTS: readonly { src: string; alt: string; caption: string }[] = [
  {
    src: `${BASE}/media/block.png`,
    alt: 'The TokenTable doc block listing resolved token values',
    caption: 'Doc blocks render resolved values, CSS var names, and alias chains.',
  },
  {
    src: `${BASE}/media/navigator.png`,
    alt: 'The TokenNavigator tree of tokens grouped by type',
    caption: 'Browse the whole token set, grouped by DTCG type.',
  },
  {
    src: `${BASE}/media/switcher.png`,
    alt: 'The swatchbook theme switcher open from the toolbar',
    caption: 'Open the toolbar switcher to flip the active theme; every block re-renders.',
  },
];

/** Screenshot grid with click-to-zoom, backed by {@link Lightbox}. */
export default function ScreenshotGallery(): ReactElement {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className={styles.grid}>
        {SHOTS.map((shot, i) => (
          <figure key={shot.src} className={styles.figure}>
            <button
              type="button"
              className={styles.button}
              onClick={() => setIndex(i)}
              aria-label={`Enlarge: ${shot.alt}`}
            >
              <img className={styles.shot} src={shot.src} alt="" loading="lazy" />
            </button>
            <figcaption className={styles.caption}>{shot.caption}</figcaption>
          </figure>
        ))}
      </div>
      <Lightbox images={SHOTS} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </>
  );
}
