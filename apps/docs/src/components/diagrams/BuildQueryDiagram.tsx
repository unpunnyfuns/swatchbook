import type { ReactNode } from 'react';
import styles from './diagrams.module.css';

const LOAD_STEPS = ['Parse sources', 'Resolve aliases', 'Index axis effects'];
const QUERIES = ['value at this tuple?', 'what does this alias?', 'which axes vary this?'];

/** Why the token graph exists: expensive work once at load, instant lookups at display. */
export default function BuildQueryDiagram(): ReactNode {
  return (
    <div className={styles.scroller}>
      <svg
        className={styles.diagram}
        viewBox="0 0 760 300"
        role="img"
        aria-labelledby="build-query-diagram-title"
      >
        <title id="build-query-diagram-title">
          At load time, sources are parsed, aliases resolved, and axis effects indexed into the
          token graph, once. At display time, blocks query the graph for values, aliases, and
          variance and get instant answers; nothing on the display side reaches back into parsing.
        </title>
        <defs>
          <marker
            id="build-query-arrow"
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
        <rect className={styles.zone} x="8" y="40" width="300" height="220" rx="8" />
        <rect className={styles.zone} x="452" y="40" width="300" height="220" rx="8" />
        <text className={styles.zoneTitle} x="158" y="64">
          At load: once
        </text>
        <text className={styles.zoneTitle} x="602" y="64">
          At display: constantly
        </text>
        <line className={styles.barrier} x1="380" y1="40" x2="380" y2="118" />
        <line className={styles.barrier} x1="380" y1="182" x2="380" y2="260" />
        {LOAD_STEPS.map((label, i) => (
          <g key={label}>
            <rect className={styles.node} x="58" y={78 + i * 52} width="200" height="36" rx="6" />
            <text className={styles.label} x="158" y={101 + i * 52}>
              {label}
            </text>
          </g>
        ))}
        {[114, 166].map((y) => (
          <line
            key={y}
            className={styles.edge}
            x1="158"
            y1={y}
            x2="158"
            y2={y + 14}
            markerEnd="url(#build-query-arrow)"
          />
        ))}
        <line
          className={styles.edge}
          x1="258"
          y1="149"
          x2="316"
          y2="150"
          markerEnd="url(#build-query-arrow)"
        />
        <rect className={styles.nodeAccent} x="325" y="124" width="110" height="52" rx="6" />
        <text className={styles.label} x="380" y="154">
          Token graph
        </text>
        {QUERIES.map((label, i) => (
          <g key={label}>
            <line
              className={styles.edge}
              x1="435"
              y1="150"
              x2="487"
              y2={96 + i * 52}
              markerEnd="url(#build-query-arrow)"
            />
            <rect className={styles.node} x="496" y={78 + i * 52} width="224" height="36" rx="6" />
            <text className={styles.label} x="608" y={101 + i * 52}>
              {label}
            </text>
          </g>
        ))}
        <text className={styles.labelSmall} x="158" y="282">
          expensive work, done once
        </text>
        <text className={styles.labelSmall} x="602" y="282">
          instant answers, every render
        </text>
      </svg>
    </div>
  );
}
