import type { ReactNode } from 'react';
import styles from './diagrams.module.css';

const STEPS: readonly { x: number; label: string; sub: string }[] = [
  { x: 8, label: 'Pick a context', sub: 'mode: Dark' },
  { x: 200, label: 'Tuple updates', sub: 'one context per axis' },
  { x: 392, label: 'Values apply', sub: 'precomputed at load' },
  { x: 584, label: 'Preview repaints', sub: 'nothing is rebuilt' },
];

/** What flipping an axis actually does: selection among precomputed values, not a rebuild. */
export default function AxisFlipDiagram(): ReactNode {
  return (
    <div className={styles.scroller}>
      <svg
        className={styles.diagram}
        viewBox="0 0 760 164"
        role="img"
        aria-labelledby="axis-flip-diagram-title"
      >
        <title id="axis-flip-diagram-title">
          Flipping an axis picks a context, updates the active tuple, applies values that were
          precomputed at load, and repaints the preview. Nothing is rebuilt.
        </title>
        <defs>
          <marker
            id="axis-flip-arrow"
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
        {STEPS.map((step) => (
          <g key={step.label}>
            <rect className={styles.node} x={step.x} y="56" width="164" height="56" rx="6" />
            <text className={styles.label} x={step.x + 82} y="80">
              {step.label}
            </text>
            <text className={styles.labelSmall} x={step.x + 82} y="98">
              {step.sub}
            </text>
          </g>
        ))}
        {[172, 364, 556].map((x) => (
          <line
            key={x}
            className={styles.edge}
            x1={x}
            y1="84"
            x2={x + 25}
            y2="84"
            markerEnd="url(#axis-flip-arrow)"
          />
        ))}
        <text className={styles.labelSmall} x="380" y="148">
          a flip selects among values that already exist
        </text>
      </svg>
    </div>
  );
}
