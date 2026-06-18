import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useColorMode } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Lightbox from '../components/Lightbox';
import { MODE_AXIS, useSwatchbookSwitcher } from '../components/SwatchbookSwitcherContext';
import styles from './index.module.css';

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

// Read a swatch's live computed colour back to a #hex string for the readout.
function readHex(el: HTMLElement | null): string | null {
  if (!el) return null;
  const rgb = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
  if (!rgb) return null;
  return `#${rgb
    .slice(0, 3)
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, '0'))
    .join('')}`;
}

function toDocusaurusMode(context: string): 'light' | 'dark' {
  return context.toLowerCase() === 'dark' ? 'dark' : 'light';
}

// In-hero quick-access axis chips. They drive the *real* switcher state — mode
// via Docusaurus's colour-mode, the rest via the switcher context — so the whole
// page and the navbar switcher stay in lockstep when a chip is flipped.
function HeroModifiers(): ReactNode {
  const { axes, nonModeTuple, setNonModeAxis } = useSwatchbookSwitcher();
  const { colorMode, setColorMode } = useColorMode();
  return (
    <div className={styles.heroMods}>
      <span className={styles.modHint}>flip a modifier ↓</span>
      {axes.map((axis) => {
        const isMode = axis.name === MODE_AXIS;
        const active = isMode
          ? (axis.contexts.find((c) => c.toLowerCase() === colorMode) ?? axis.contexts[0])
          : (nonModeTuple[axis.name] ?? axis.default);
        return (
          <span key={axis.name} className={styles.seg}>
            {axis.contexts.map((ctx) => (
              <button
                key={ctx}
                type="button"
                aria-pressed={ctx === active}
                onClick={() =>
                  isMode ? setColorMode(toDocusaurusMode(ctx)) : setNonModeAxis(axis.name, ctx)
                }
              >
                {ctx}
              </button>
            ))}
          </span>
        );
      })}
    </div>
  );
}

// The hero showpiece. Two token journeys — a colour token and a typography
// token — each from DTCG `$value` through the alias graph to the actionable
// `var(--sb-*)` you ship. Built on real reactive tokens (`--sb-color-primary-
// default`, `--sb-font-family-base`), so the band re-resolves live when the
// modifiers flip: mode/contrast move the colour row, typeface/contrast the type
// row. The swatch repaints via `var()`; the hex text is read back on each flip.
function ResolutionPipeline(): ReactNode {
  const swatchRef = useRef<HTMLSpanElement>(null);
  const { colorMode } = useColorMode();
  const { nonModeTuple } = useSwatchbookSwitcher();
  const [hex, setHex] = useState('#2563eb');

  useEffect(() => {
    const next = readHex(swatchRef.current);
    if (next) setHex(next);
  }, [colorMode, nonModeTuple]);

  return (
    <div className={styles.band}>
      <div className={styles.pipeRow}>
        <div className={styles.stage}>
          <span className={styles.lab}>DTCG source</span>
          <pre className={styles.src}>
            {'"primary": {\n  "$type": "color",\n  "$value": '}
            <span className={styles.ref}>{'"{palette.brand.600}"'}</span>
            {'\n}'}
          </pre>
        </div>
        <div className={styles.arrow} aria-hidden="true">
          →
        </div>
        <div className={styles.stage}>
          <span className={styles.lab}>resolves</span>
          <div className={styles.node}>
            <span className={styles.ref}>palette.brand.600</span>
          </div>
          <div className={styles.node}>
            <span
              ref={swatchRef}
              className={styles.sw}
              style={{ background: 'var(--sb-color-primary-default)' }}
            />
            <span className={styles.hex}>{hex}</span>
          </div>
        </div>
        <div className={styles.arrow} aria-hidden="true">
          →
        </div>
        <div className={styles.stage}>
          <span className={styles.lab}>actionable variable</span>
          <span className={styles.varName}>--sb-color-primary-default</span>
          <pre className={styles.usage}>background: var(--sb-color-primary-default);</pre>
        </div>
      </div>

      <div className={styles.pipeRow}>
        <div className={styles.stage}>
          <pre className={styles.src}>
            {'"body": {\n  "$type": "fontFamily",\n  "$value": '}
            <span className={styles.ref}>{'"{font.family.system}"'}</span>
            {'\n}'}
          </pre>
        </div>
        <div className={styles.arrow} aria-hidden="true">
          →
        </div>
        <div className={styles.stage}>
          <div className={styles.node}>
            <span className={styles.ref}>font.family.system</span>
          </div>
          <div className={styles.node}>
            <span className={styles.typeSample}>Aa</span>
          </div>
        </div>
        <div className={styles.arrow} aria-hidden="true">
          →
        </div>
        <div className={styles.stage}>
          <span className={styles.varName}>--sb-font-family-base</span>
          <pre className={styles.usage}>font-family: var(--sb-font-family-base);</pre>
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
          <p className={styles.eyebrow}>@unpunnyfuns/swatchbook</p>
          <h1 className={styles.title}>Design tokens, documented in Storybook.</h1>
          <p className={styles.lead}>
            Parse your DTCG sources, preview every token in doc blocks, and watch them re-render as
            you switch themes from the toolbar.
          </p>
          <div className={styles.ctas}>
            <Link className="button button--primary button--lg" to="/quickstart">
              Get started
            </Link>
            <Link className="button button--secondary button--lg" to="pathname:///storybook/">
              Live Storybook
            </Link>
          </div>
          <HeroModifiers />
          <ResolutionPipeline />
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
                  <img className={styles.shot} src={shot.src} alt="" loading="lazy" />
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
