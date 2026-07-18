import type { ReactNode } from 'react';
import styles from './diagrams.module.css';

const STAGES: readonly { x: number; label: string; sub?: string }[] = [
  { x: 8, label: 'Token sources', sub: 'DTCG files' },
  { x: 160, label: 'Parse' },
  { x: 312, label: 'Build graph' },
  { x: 464, label: 'Snapshot' },
  { x: 616, label: 'Preview', sub: 'CSS vars + blocks' },
];

/** Order of operations from token files on disk to a live preview, drawn as one loop. */
export default function IngestionDiagram(): ReactNode {
  return (
    <div className={styles.scroller}>
      <svg
        className={styles.diagram}
        viewBox="0 0 760 204"
        role="img"
        aria-labelledby="ingestion-diagram-title"
      >
        <title id="ingestion-diagram-title">
          Token source files are parsed, built into a graph, snapshotted, and shown in the
          preview as CSS variables and doc blocks. Saving a source file re-runs the whole
          pipeline in memory.
        </title>
        <defs>
          <marker
            id="ingestion-arrow"
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
            id="ingestion-arrow-accent"
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
        <text className={styles.labelSmall} x="380" y="38">
          runs in memory; nothing is written to disk
        </text>
        {STAGES.map((stage) => (
          <g key={stage.label}>
            <rect className={styles.node} x={stage.x} y="64" width="136" height="56" rx="6" />
            <text className={styles.label} x={stage.x + 68} y={stage.sub ? 88 : 96}>
              {stage.label}
            </text>
            {stage.sub ? (
              <text className={styles.labelSmall} x={stage.x + 68} y="106">
                {stage.sub}
              </text>
            ) : null}
          </g>
        ))}
        {[144, 296, 448, 600].map((x) => (
          <line
            key={x}
            className={styles.edge}
            x1={x}
            y1="92"
            x2={x + 13}
            y2="92"
            markerEnd="url(#ingestion-arrow)"
          />
        ))}
        <path
          className={styles.edgeAccent}
          d="M684 120 V172 H76 V124"
          markerEnd="url(#ingestion-arrow-accent)"
        />
        <text className={styles.labelSmall} x="380" y="190">
          saving a source file re-runs the pipeline
        </text>
      </svg>
    </div>
  );
}
