import type { ReactNode } from 'react';
import styles from './diagrams.module.css';

const CONSUMERS: readonly { y: number; label: string; sub: string }[] = [
  { y: 20, label: 'Storybook preview', sub: 'the addon' },
  { y: 80, label: 'Docs-site blocks', sub: 'outside Storybook' },
  { y: 140, label: 'MCP server', sub: 'AI agents' },
];

/** One project snapshot, three independent consumers. */
export default function SnapshotConsumersDiagram(): ReactNode {
  return (
    <div className={styles.scroller}>
      <svg
        className={styles.diagram}
        viewBox="0 0 760 208"
        role="img"
        aria-labelledby="snapshot-consumers-diagram-title"
      >
        <title id="snapshot-consumers-diagram-title">
          One project snapshot feeds the Storybook preview, doc blocks outside Storybook, and the
          MCP server.
        </title>
        <defs>
          <marker
            id="snapshot-consumers-arrow"
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
        <rect className={styles.nodeAccent} x="80" y="78" width="170" height="52" rx="6" />
        <text className={styles.label} x="165" y="99">
          Project snapshot
        </text>
        <text className={styles.labelSmall} x="165" y="117">
          computed once
        </text>
        {CONSUMERS.map((consumer) => (
          <g key={consumer.label}>
            <line
              className={styles.edge}
              x1="250"
              y1="104"
              x2="461"
              y2={consumer.y + 24}
              markerEnd="url(#snapshot-consumers-arrow)"
            />
            <rect className={styles.node} x="470" y={consumer.y} width="210" height="48" rx="6" />
            <text className={styles.label} x="575" y={consumer.y + 20}>
              {consumer.label}
            </text>
            <text className={styles.labelSmall} x="575" y={consumer.y + 38}>
              {consumer.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
