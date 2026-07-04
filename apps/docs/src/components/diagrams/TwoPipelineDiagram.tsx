import type { ReactNode } from 'react';
import styles from './diagrams.module.css';

/** One DTCG source read by two pipelines: the production build and the Storybook preview. */
export default function TwoPipelineDiagram(): ReactNode {
  return (
    <div className={styles.scroller}>
      <svg
        className={styles.diagram}
        viewBox="0 0 760 250"
        role="img"
        aria-labelledby="two-pipeline-diagram-title"
      >
        <title id="two-pipeline-diagram-title">
          One DTCG token source is read twice: Terrazzo's CLI builds production artifacts, and
          swatchbook shows the same tokens in the Storybook preview.
        </title>
        <defs>
          <marker
            id="two-pipeline-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowhead} />
          </marker>
        </defs>
        <rect className={styles.nodeAccent} x="8" y="97" width="160" height="56" rx="6" />
        <text className={styles.label} x="88" y="129">
          DTCG tokens
        </text>
        <line
          className={styles.edge}
          x1="168"
          y1="115"
          x2="288"
          y2="55"
          markerEnd="url(#two-pipeline-arrow)"
        />
        <line
          className={styles.edge}
          x1="168"
          y1="135"
          x2="288"
          y2="195"
          markerEnd="url(#two-pipeline-arrow)"
        />
        <rect className={styles.node} x="300" y="28" width="170" height="56" rx="6" />
        <text className={styles.label} x="385" y="60">
          Terrazzo CLI
        </text>
        <rect className={styles.node} x="300" y="166" width="170" height="56" rx="6" />
        <text className={styles.label} x="385" y="198">
          swatchbook
        </text>
        <line
          className={styles.edge}
          x1="470"
          y1="56"
          x2="543"
          y2="56"
          markerEnd="url(#two-pipeline-arrow)"
        />
        <line
          className={styles.edge}
          x1="470"
          y1="194"
          x2="543"
          y2="194"
          markerEnd="url(#two-pipeline-arrow)"
        />
        <rect className={styles.node} x="552" y="28" width="200" height="56" rx="6" />
        <text className={styles.label} x="652" y="52">
          Production artifacts
        </text>
        <text className={styles.labelSmall} x="652" y="70">
          CSS, Swift, Android
        </text>
        <rect className={styles.node} x="552" y="166" width="200" height="56" rx="6" />
        <text className={styles.label} x="652" y="190">
          Storybook preview
        </text>
        <text className={styles.labelSmall} x="652" y="208">
          blocks + toolbar
        </text>
        <text className={styles.labelSmall} x="380" y="242">
          two readers of one source; aligned options keep their output matching
        </text>
      </svg>
    </div>
  );
}
