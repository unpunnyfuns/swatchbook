import type { ReactNode } from 'react';
import styles from './diagrams.module.css';

const ROWS: ReadonlyArray<{ y: number; mechanism: string; consumer: string; sub: string }> = [
  { y: 24, mechanism: 'CSS variables', consumer: 'var(--…)', sub: 'zero code' },
  { y: 92, mechanism: 'React context', consumer: 'useActiveAxes()', sub: 'inside the preview' },
  { y: 160, mechanism: 'data attributes', consumer: 'MutationObserver', sub: 'any framework' },
];

/** One axis flip, three surfaces it updates, three ways a story can consume it. */
export default function ThemeConsumptionDiagram(): ReactNode {
  return (
    <div className={styles.scroller}>
      <svg
        className={styles.diagram}
        viewBox="0 0 760 232"
        role="img"
        aria-labelledby="theme-consumption-diagram-title"
      >
        <title id="theme-consumption-diagram-title">
          Flipping an axis updates CSS variables, the React context, and data attributes at
          once. Stories consume whichever surface fits: plain CSS var() with zero code, the
          useActiveAxes hook inside the preview, or a MutationObserver in any framework.
        </title>
        <defs>
          <marker
            id="theme-consumption-arrow"
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
        <rect className={styles.nodeAccent} x="8" y="88" width="140" height="56" rx="6" />
        <text className={styles.label} x="78" y="112">
          Axis flip
        </text>
        <text className={styles.labelSmall} x="78" y="130">
          in the toolbar
        </text>
        {ROWS.map((row) => (
          <g key={row.mechanism}>
            <line
              className={styles.edge}
              x1="148"
              y1="116"
              x2="201"
              y2={row.y + 24}
              markerEnd="url(#theme-consumption-arrow)"
            />
            <rect className={styles.node} x="210" y={row.y} width="170" height="48" rx="6" />
            <text className={styles.label} x="295" y={row.y + 29}>
              {row.mechanism}
            </text>
            <line
              className={styles.edge}
              x1="380"
              y1={row.y + 24}
              x2="441"
              y2={row.y + 24}
              markerEnd="url(#theme-consumption-arrow)"
            />
            <rect className={styles.node} x="450" y={row.y} width="240" height="48" rx="6" />
            <text className={styles.labelMono} x="570" y={row.y + 21}>
              {row.consumer}
            </text>
            <text className={styles.labelSmall} x="570" y={row.y + 38}>
              {row.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
