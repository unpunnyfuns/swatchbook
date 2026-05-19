// packages/core/src/token-graph/types.ts
import type { SwatchbookToken } from '#/types.ts';

/**
 * A single per-(axis, context) overlay declaration. `literal` is a
 * concrete value; `alias` redirects to another path; `partial-alias`
 * blends a literal-fields base with per-sub-field alias targets.
 */
export type WriteValue =
  | { kind: 'literal'; value: SwatchbookToken }
  | { kind: 'alias'; target: string }
  | { kind: 'partial-alias'; baseValue: SwatchbookToken; aliasFields: Record<string, string> };

/**
 * Per-token-path node. JSON-serializable — no Map/Set in the wire
 * format. See `docs/superpowers/specs/2026-05-19-alias-graph-redesign-design.md`
 * for the design rationale.
 */
export interface TokenGraphNode {
  baselineValue: SwatchbookToken;
  baselineKind: 'literal' | 'alias' | 'partial-alias';
  baselineAliasTarget?: string;
  baselinePartialFields?: Record<string, string>;
  writes: Record<string, Record<string, WriteValue>>;
  affectedBy: readonly string[];
  aliases: readonly string[];
  aliasedBy: readonly string[];
}

export interface TokenGraph {
  nodes: Record<string, TokenGraphNode>;
  axes: readonly string[];
  axisDefaults: Record<string, string>;
}
