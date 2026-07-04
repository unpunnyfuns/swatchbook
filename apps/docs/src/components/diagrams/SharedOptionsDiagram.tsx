import type { ReactNode } from 'react';
import styles from './diagrams.module.css';

/** The shared-options diamond: one module imported by both configs, matching output. */
export default function SharedOptionsDiagram(): ReactNode {
  return (
    <div className={styles.scroller}>
      <svg
        className={styles.diagram}
        viewBox="0 0 760 264"
        role="img"
        aria-labelledby="shared-options-diagram-title"
      >
        <title id="shared-options-diagram-title">
          Both the Terrazzo CLI config and the swatchbook config import one shared options
          module, so the production build and the Storybook preview format values the same
          way.
        </title>
        <defs>
          <marker
            id="shared-options-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowhead} />
          </marker>
          <marker
            id="shared-options-arrow-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowheadAccent} />
          </marker>
        </defs>
        <rect className={styles.nodeAccent} x="280" y="16" width="200" height="48" rx="6" />
        <text className={styles.label} x="380" y="44">
          shared options
        </text>
        <line
          className={styles.edge}
          x1="325"
          y1="64"
          x2="190"
          y2="101"
          markerEnd="url(#shared-options-arrow)"
        />
        <line
          className={styles.edge}
          x1="435"
          y1="64"
          x2="570"
          y2="101"
          markerEnd="url(#shared-options-arrow)"
        />
        <rect className={styles.node} x="75" y="108" width="200" height="44" rx="6" />
        <text className={styles.labelMono} x="175" y="135">
          terrazzo.config.ts
        </text>
        <rect className={styles.node} x="485" y="108" width="200" height="44" rx="6" />
        <text className={styles.labelMono} x="585" y="135">
          swatchbook.config.ts
        </text>
        <line
          className={styles.edge}
          x1="175"
          y1="152"
          x2="175"
          y2="190"
          markerEnd="url(#shared-options-arrow)"
        />
        <line
          className={styles.edge}
          x1="585"
          y1="152"
          x2="585"
          y2="190"
          markerEnd="url(#shared-options-arrow)"
        />
        <rect className={styles.node} x="75" y="196" width="200" height="48" rx="6" />
        <text className={styles.label} x="175" y="224">
          Production build
        </text>
        <rect className={styles.node} x="485" y="196" width="200" height="48" rx="6" />
        <text className={styles.label} x="585" y="224">
          Storybook preview
        </text>
        <text className={styles.labelSmall} x="380" y="208">
          matching values and names
        </text>
        <line
          className={styles.edgeAccent}
          x1="285"
          y1="220"
          x2="475"
          y2="220"
          markerStart="url(#shared-options-arrow-accent)"
          markerEnd="url(#shared-options-arrow-accent)"
        />
      </svg>
    </div>
  );
}
