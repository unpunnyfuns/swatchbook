import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Lightbox from '../components/Lightbox';
import styles from './index.module.css';

// Hero swatch deck — built from swatchbook's own palette tokens (defined in
// tokens.generated.css at :root, flipped per mode/brand by the docs theme).
// The hero is literally what the product documents: ramps of design tokens.
const RAMPS: readonly { label: string; base: string; stops: readonly number[] }[] = [
  { label: 'brand', base: '--sb-color-palette-brand', stops: [300, 400, 500, 600, 700, 800] },
  { label: 'amber', base: '--sb-color-palette-amber', stops: [300, 400, 500, 600, 700, 800] },
  { label: 'neutral', base: '--sb-color-palette-neutral', stops: [100, 200, 300, 500, 700, 800] },
];

const FONTS: readonly string[] = [
  '--sb-font-family-base',
  '--sb-font-family-mono',
  '--sb-font-family-system',
  '--sb-font-family-comic',
  '--sb-font-family-comic-mono',
  '--sb-font-family-base-accessible',
];

const COLOR_CHIP_COUNT = RAMPS.reduce((n, r) => n + r.stops.length, 0);

const SHOTS: readonly { src: string; alt: string; caption: string }[] = [
  {
    src: 'media/block.png',
    alt: 'The TokenTable doc block listing resolved token values',
    caption: 'Doc blocks render resolved values, CSS var names, and alias chains.',
  },
  {
    src: 'media/navigator.png',
    alt: 'The TokenNavigator tree of tokens grouped by type',
    caption: 'Browse the whole token set, grouped by DTCG type.',
  },
  {
    src: 'media/switcher.png',
    alt: 'The swatchbook theme switcher open from the toolbar',
    caption: 'Open the toolbar switcher to flip the active theme; every block re-renders.',
  },
];

function SwatchDeck(): ReactNode {
  return (
    <div className={styles.deck} aria-hidden="true">
      {RAMPS.map((ramp, r) => (
        <div key={ramp.label} className={styles.ramp}>
          <span className={styles.rampLabel}>{ramp.label}</span>
          <div className={styles.chips}>
            {ramp.stops.map((stop, c) => {
              const varName = `${ramp.base}-${stop}`;
              return (
                <span
                  key={stop}
                  className={`${styles.swatch} ${styles.chip}`}
                  data-var={varName}
                  style={{
                    background: `var(${varName})`,
                    animationDelay: `${(r * ramp.stops.length + c) * 40}ms`,
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div className={styles.ramp}>
        <span className={styles.rampLabel}>type</span>
        <div className={styles.chips}>
          {FONTS.map((font, i) => (
            <span
              key={font}
              className={`${styles.swatch} ${styles.fontChip}`}
              data-var={font}
              style={{
                fontFamily: `var(${font})`,
                animationDelay: `${(COLOR_CHIP_COUNT + i) * 40}ms`,
              }}
            >
              Aa
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const shotImages = [
    { ...SHOTS[0]!, src: useBaseUrl(SHOTS[0]!.src) },
    { ...SHOTS[1]!, src: useBaseUrl(SHOTS[1]!.src) },
    { ...SHOTS[2]!, src: useBaseUrl(SHOTS[2]!.src) },
  ];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <Layout title="swatchbook" description="Storybook addon for DTCG design tokens">
      <main>
        <div className={styles.switcherHint}>
          <span>Try the theme switcher</span>
          <span className={styles.switcherArrow} aria-hidden="true">
            ↗
          </span>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>@unpunnyfuns/swatchbook</p>
            <h1 className={styles.title}>Design tokens, documented in Storybook.</h1>
            <p className={styles.lead}>
              Parse your DTCG sources, preview every token in doc blocks, and watch them
              re-render as you switch themes from the toolbar.
            </p>
            <div className={styles.ctas}>
              <Link className={styles.ctaPrimary} to="/quickstart">
                Get started
              </Link>
              <Link className={styles.ctaSecondary} to="pathname:///storybook/">
                Live Storybook
              </Link>
            </div>
          </div>
          <SwatchDeck />
        </section>

        <section className={styles.previews}>
          <h2 className={styles.previewsTitle}>What it looks like</h2>
          <div className={styles.previewsGrid}>
            {shotImages.map((shot, i) => (
              <figure key={shot.src} className={styles.shotFigure}>
                <button
                  type="button"
                  className={styles.shotButton}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Enlarge: ${shot.alt}`}
                >
                  <img className={styles.shot} src={shot.src} alt={shot.alt} loading="lazy" />
                </button>
                <figcaption className={styles.shotCaption}>{shot.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.cards}>
          <Link className={styles.card} to="/quickstart">
            <h3>Guides</h3>
            <p>Install, author doc pages, wire integrations.</p>
          </Link>
          <Link className={styles.card} to="/reference/addon">
            <h3>Reference</h3>
            <p>Packages, blocks, config, diagnostics.</p>
          </Link>
          <Link className={styles.card} to="/concepts/overview">
            <h3>Concepts</h3>
            <p>The model: axes, the token graph, the pipeline.</p>
          </Link>
          <Link className={styles.card} to="/developers/">
            <h3>Developers</h3>
            <p>Architecture and contributor notes.</p>
          </Link>
        </section>
      </main>

      <Lightbox
        images={shotImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </Layout>
  );
}
