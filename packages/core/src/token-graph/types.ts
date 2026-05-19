import type { SwatchbookToken } from '#/types.ts';

/**
 * A single per-(axis, context) overlay declaration. `literal` is a
 * concrete value; `alias` redirects to another path; `partial-alias`
 * blends a literal-fields base with per-sub-field alias targets.
 *
 * The `alias` arm intentionally carries no stored value. The walker
 * resolves `target` at the joint tuple at read time, so caching a value
 * here would be wrong — the resolved value depends on the full tuple and
 * may differ for every (axis, context) combination in flight.
 */
export type WriteValue =
  | { kind: 'literal'; value: SwatchbookToken }
  | { kind: 'alias'; target: string }
  | { kind: 'partial-alias'; baseValue: SwatchbookToken; aliasFields: Record<string, string> };

/**
 * Per-token-path node. JSON-serializable — no Map/Set in the wire
 * format. See the token-graph redesign spec for the design rationale.
 *
 * **Baseline fields** serve a dual purpose. `baselineValue` is always
 * the resolved leaf value at the default tuple — what consumers display
 * when they do not care about resolution shape (e.g. TokenTable showing
 * a resolved color). `baselineKind`, `baselineAliasTarget`, and
 * `baselinePartialFields` describe the structural shape the walker
 * follows when resolving at non-default tuples, where an axis write or
 * alias may steer through a different chain. The fields are kept separate
 * from `WriteValue` precisely because they serve both display (single
 * value) and walking (structure) — collapsing into a single
 * `baseline: WriteValue` would force every display call site to walk the
 * alias chain just to render a value.
 */
export interface TokenGraphNode {
  baselineValue: SwatchbookToken;
  baselineKind: 'literal' | 'alias' | 'partial-alias';
  baselineAliasTarget?: string;
  baselinePartialFields?: Record<string, string>;
  /**
   * Per-(axis, context) overlay declarations keyed as
   * `writes[axisName][contextName]`. The outer key is the axis name
   * (e.g. `"mode"`); the inner key is the context name within that axis
   * (e.g. `"Dark"`). Only non-default contexts have entries — default
   * contexts produce no write and are absent from this record.
   */
  writes: Record<string, Record<string, WriteValue>>;
  /**
   * Forward edges in the alias graph. The immediate target path(s) that
   * this token aliases at baseline. Typically zero or one entry; partial-
   * alias composites can have multiple sub-field targets.
   */
  aliases: readonly string[];
  /**
   * Reverse edges in the alias graph. Other token paths that alias TO
   * this token, scoped to the project. Note: this is distinct from
   * `SwatchbookToken.aliasedBy`, which is global to the parser and may
   * include paths outside the current project.
   */
  aliasedBy: readonly string[];
  /**
   * Derived axis-sensitivity index. The set of axis names whose writes —
   * direct or transitive through alias chains — can change this token's
   * resolved value at any tuple. Used by the walker's fast-path to
   * short-circuit resolution when no axis in the requested tuple is
   * relevant to this token.
   */
  affectedBy: readonly string[];
}

export interface TokenGraph {
  nodes: Record<string, TokenGraphNode>;
  axes: readonly string[];
  /**
   * Default context name per axis, keyed as
   * `axisDefaults[axisName] = defaultContextName`. Used by the walker's
   * fast-path and by `resolveAt` to fill in axes the caller omitted from
   * the requested tuple.
   */
  axisDefaults: Record<string, string>;
  /**
   * Per-axis context list, keyed by axis name. `axisContexts[axisName]`
   * is the ordered list of all context names for that axis, including
   * the default. Carries enough info for `getVariance` to iterate each
   * axis's contexts without needing the original `Axis[]` array. Wire
   * payload includes this so browser consumers can derive variance
   * shape from the graph alone.
   */
  axisContexts: Record<string, readonly string[]>;
}
