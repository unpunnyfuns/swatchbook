import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import styles from './index.module.css';

const CARDS = [
  { to: '/guides/authoring-doc-stories', title: 'Guides', blurb: 'Install, author doc pages, wire integrations.' },
  { to: '/reference/addon', title: 'Reference', blurb: 'Packages, blocks, config, diagnostics.' },
  { to: '/concepts/overview', title: 'Concepts', blurb: 'The model: axes, the token graph, the pipeline.' },
  { to: '/developers/', title: 'Developers', blurb: 'Architecture and contributor notes.' },
];

const SHOT_SRCS = [
  'media/toolbar.png',
  'media/block.png',
  'media/navigator.png',
];

const SHOT_ALTS = [
  'Swatchbook theme toolbar',
  'A swatchbook doc block',
  'The token navigator',
];

export default function Home(): ReactNode {
  const clip = useBaseUrl('media/toolbar-flip.webm');
  const poster = useBaseUrl('media/toolbar.png');
  const shotUrls = [
    useBaseUrl(SHOT_SRCS[0]),
    useBaseUrl(SHOT_SRCS[1]),
    useBaseUrl(SHOT_SRCS[2]),
  ];
  return (
    <Layout title="swatchbook" description="Storybook addon for DTCG design tokens">
      <header className={styles.hero}>
        <h1>swatchbook</h1>
        <p className={styles.tagline}>DTCG design tokens, live in Storybook.</p>
        <div className={styles.ctas}>
          <Link className="button button--primary button--lg" to="/quickstart">Get started</Link>
          <Link className="button button--secondary button--lg" to="pathname:///storybook/">Live Storybook</Link>
        </div>
      </header>
      <main>
        <section className={styles.media}>
          <video className={styles.clip} src={clip} poster={poster} autoPlay muted loop playsInline />
          <div className={styles.shots}>
            {shotUrls.map((src, i) => (
              <img key={SHOT_SRCS[i]} className={styles.shot} src={src} alt={SHOT_ALTS[i]} />
            ))}
          </div>
        </section>
        <section className={styles.cards}>
          {CARDS.map((c) => (
            <Link key={c.to} className={styles.card} to={c.to}>
              <h3>{c.title}</h3>
              <p>{c.blurb}</p>
            </Link>
          ))}
        </section>
      </main>
    </Layout>
  );
}
