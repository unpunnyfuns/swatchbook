import type { TokenNormalized } from '@terrazzo/parser';
import { generateShorthand, makeCSSVar, transformCSSValue } from '@terrazzo/token-tools/css';
import { CHROME_ROLES, CHROME_VAR_PREFIX, DEFAULT_CHROME_MAP } from '#/chrome.ts';
import { cssEscape } from '#/css-escape.ts';
import { dataAttr } from '#/data-attr.ts';
import { listPaths } from '#/token-graph/queries.ts';
import { resolveAliasAllAt, resolveAllAt } from '#/token-graph/walk.ts';
import { canonicalKey } from '#/tuple-key.ts';
import type { Project, TokenMap } from '#/types.ts';
import { valueKey } from '#/value-key.ts';

// Internal alias: the raw Terrazzo-shape map this emitter passes into
// `transformCSSValue` / `generateShorthand`. The graph stores slim
// `SwatchbookToken` shapes (no `id`, `source`, `mode`, etc.). The CSS
// emitter needs `token.id` (= the token path) for `transformAlias` and
// `defaultAliasTransform`. `withSyntheticIds` injects `id: path` so
// `transformCSSValue` can resolve alias var references correctly without
// requiring the full Terrazzo shape in the graph.
type RawTokenMap = Record<string, TokenNormalized>;

function withSyntheticIds(map: TokenMap): RawTokenMap {
  const out: RawTokenMap = {};
  for (const [path, token] of Object.entries(map)) {
    out[path] = { ...token, id: path } as unknown as TokenNormalized;
  }
  return out;
}

// Produces a token's emitted CSS value, applying the same cssOptions the
// listing build (plugin-css) applies — `legacyHex` color output and a user
// `transform` hook — so preview CSS and the listing previewValue come from
// one option set and never diverge.
type TransformValue = (
  token: TokenNormalized,
  tokensSet: RawTokenMap,
  permutation: Record<string, string>,
) => ReturnType<typeof transformCSSValue>;

// Distinguishes a token's variance shape so the emitter can route it.
type VarianceInfo =
  | {
      kind: 'baseline-only';
    }
  | {
      kind: 'single-axis';
      axis: string;
    }
  | {
      kind: 'orthogonal-after-probe';
      touching: ReadonlySet<string>;
    }
  | {
      kind: 'joint-variant';
      touching: ReadonlySet<string>;
      jointCases: readonly JointCase[];
    };

// One concrete partial tuple (2+ axes at non-default contexts) where
// cascade composition would NOT produce the cartesian-correct value
// for this token. Emitted as a compound `[data-axis="…"][…]` block.
//
// `tuple` carries only the non-default axes — its `Object.keys` length
// is the joint case's arity (2 for pairs, 3 for triples, etc.).
interface JointCase {
  tuple: Record<string, string>;
  cartesianValueKey: string;
}

// Default cap on joint-case arity probed per token. See `Config.maxJointArity`
// in the public types for the per-project override and the failure-mode
// tradeoffs. Per-token work scales as
// `Σ C(|affectedBy|, k) × Π non_default_contexts` for k = 2..arity.
// 4 covers virtually all design-system shapes (mode × brand × density ×
// contrast is the largest real-world joint anyone tends to express);
// beyond that, joint blocks aren't emitted and the cascade resolves to
// whatever lower-arity composition produces.
const DEFAULT_MAX_JOINT_ARITY = 4;

// Classify every token in a project. Returns a Map keyed by token path.
// Reads from `project.tokenGraph` — the sole resolution surface.
//
// For tokens affected by 2+ axes, probes joint divergences from arity 2
// up to `min(|affectedBy|, MAX_JOINT_ARITY)`. Each probe checks whether
// cascade composition (baseline + per-axis cell overlays in project axis
// order + lower-arity joint corrections recorded for this token) produces
// the cartesian-correct value at the candidate tuple. When it doesn't,
// an arity-k joint case is recorded — which will become an arity-k
// compound block at emission.
//
// The per-token bound on probing scope is what keeps this tractable for
// many-axis projects: a token affected by 3 axes only ever probes within
// those 3 axes, regardless of how many axes the project has overall.
function analyzeProjectVariance(project: Project): Map<string, VarianceInfo> {
  const result = new Map<string, VarianceInfo>();
  const { axes, tokenGraph, defaultTuple } = project;

  if (axes.length === 0) {
    for (const path of listPaths(tokenGraph)) {
      result.set(path, { kind: 'baseline-only' });
    }
    return result;
  }

  const axisByName = new Map<string, Axis>(axes.map((a) => [a.name, a]));
  const projectAxisOrder = new Map<string, number>(axes.map((a, i) => [a.name, i]));
  const configuredMaxArity =
    typeof project.config.maxJointArity === 'number' && project.config.maxJointArity > 0
      ? project.config.maxJointArity
      : DEFAULT_MAX_JOINT_ARITY;

  // The emitter uses `resolveAllAt(tokenGraph, defaultTuple)` for its
  // baseline; our cascade simulation matches that exactly.
  const baselineValues = resolveAllAt(tokenGraph, defaultTuple);

  // Per-axis-context resolved snapshots, memoized — the simulation
  // calls `resolveAllAt(graph, { default with axis=ctx })` many times
  // across tokens, and the walker memoizes per-tuple but a Map lookup
  // here cuts the per-cell call back to a single `resolveAllAt` per
  // axis-context across all tokens.
  const cellSnapshots = new Map<string, TokenMap>();
  function cellAt(axisName: string, ctx: string): TokenMap {
    const key = `${axisName}=${ctx}`;
    let snap = cellSnapshots.get(key);
    if (snap === undefined) {
      snap = resolveAllAt(tokenGraph, { ...defaultTuple, [axisName]: ctx });
      cellSnapshots.set(key, snap);
    }
    return snap;
  }

  for (const path of listPaths(tokenGraph)) {
    const node = tokenGraph.nodes[path];
    if (!node) continue;
    const touching: Set<string> = new Set(node.affectedBy);

    if (touching.size === 0) {
      result.set(path, { kind: 'baseline-only' });
      continue;
    }

    if (touching.size === 1) {
      const [axis] = touching;
      if (axis === undefined) continue;
      result.set(path, { kind: 'single-axis', axis });
      continue;
    }

    // Order the touching axes by project axis position so cascade-composition
    // matches CSS source order at emission time.
    const touchingAxes: Axis[] = [...touching]
      .map((name) => axisByName.get(name))
      .filter((a): a is Axis => a !== undefined)
      .toSorted(
        (a, b) => (projectAxisOrder.get(a.name) ?? 0) - (projectAxisOrder.get(b.name) ?? 0),
      );

    const jointCases: JointCase[] = [];
    const maxArity = Math.min(touchingAxes.length, configuredMaxArity);
    const baselineKey = valueKey(baselineValues[path]);

    for (let arity = 2; arity <= maxArity; arity++) {
      for (const combo of axisCombinations(touchingAxes, arity)) {
        for (const partialTuple of contextProducts(combo)) {
          const fullTuple = { ...defaultTuple, ...partialTuple };
          const cartesianKey = valueKey(resolveAllAt(tokenGraph, fullTuple)[path]);

          // Compose cascade value: baseline → per-axis cells (project axis
          // order, last wins, only when cell value differs from baseline —
          // the emitter's delta-paths rule, mirrored here) → lower-arity
          // joint corrections already recorded for this token (arity
          // ascending, matching emission order).
          let composedKey = baselineKey;
          for (const axis of touchingAxes) {
            const ctx = fullTuple[axis.name];
            if (ctx === undefined || ctx === defaultTuple[axis.name]) continue;
            const cellKey = valueKey(cellAt(axis.name, ctx)[path]);
            if (cellKey !== baselineKey) {
              composedKey = cellKey;
            }
          }
          for (const jc of jointCases) {
            if (isPartialTupleSubset(jc.tuple, fullTuple)) {
              composedKey = jc.cartesianValueKey;
            }
          }

          if (cartesianKey !== composedKey) {
            jointCases.push({
              tuple: { ...partialTuple },
              cartesianValueKey: cartesianKey,
            });
          }
        }
      }
    }

    if (jointCases.length === 0) {
      result.set(path, { kind: 'orthogonal-after-probe', touching });
    } else {
      result.set(path, { kind: 'joint-variant', touching, jointCases });
    }
  }

  return result;
}

// True if every axis=ctx in `partial` appears the same way in `full`.
function isPartialTupleSubset(
  partial: Record<string, string>,
  full: Record<string, string>,
): boolean {
  for (const [axis, ctx] of Object.entries(partial)) {
    if (full[axis] !== ctx) return false;
  }
  return true;
}

/** @internal Addon-internal smart-emitter options. Not part of the public API. */
export interface EmitAxisProjectedCssOptions {
  /** Override the prefix from project config (default: `project.config.cssVarPrefix ?? ''`). */
  prefix?: string;
  /**
   * Validated chrome-alias entries from `Project.chrome`. Each `source →
   * target` pair appends `--<prefix>-<source>: var(--<prefix>-<target>);`
   * to a trailing `:root` block. Defaults to `project.chrome`. See
   * `validateChrome`.
   */
  chrome?: Record<string, string>;
  /**
   * Pre-computed variance analysis. When omitted, the emitter calls
   * `analyzeProjectVariance(project)` itself. Callers that need the
   * analysis for other purposes (diagnostics, alternative emit paths)
   * can compute it once and pass it here to avoid duplicate work.
   */
  variance?: Map<string, VarianceInfo>;
}

/**
 * Emit a single concatenated stylesheet by routing each token to the
 * cheapest emit strategy that still produces the spec-correct value
 * at every tuple. Spec-faithful for any DTCG-compliant resolver
 * (orthogonal or not):
 *
 * - **Baseline-only tokens** — emitted once in `:root`, never in any cell
 * - **Single-axis tokens** — emitted in `:root` plus the touching axis's
 *   cell blocks (standard projection: `[data-<prefix>-<axis>="<ctx>"]`)
 * - **Orthogonal-after-probe tokens** (touched by 2+ axes but
 *   cell-composition matches cartesian) — emitted in `:root` plus
 *   every touching axis's cell blocks; CSS cascade resolves the
 *   correct value at any tuple
 * - **Joint-variant tokens** (cell composition diverges from cartesian
 *   at some joint tuple) — emitted in `:root` plus per-axis cell blocks
 *   AS WELL AS compound `[data-A="ctx_a"][data-B="ctx_b"]` blocks
 *   carrying the cartesian-correct value at exactly the divergent
 *   joint tuples. Compound selector specificity `(0,2,0)` beats the
 *   singletons' `(0,1,0)`, so the joint cell wins under cascade.
 *
 * Smart dedup: every cell re-emits a token's value when ANY axis touches
 * the token (not just when this cell differs from baseline). For
 * orthogonal-after-probe tokens this means the last touching axis's
 * cell wins under cascade — which matches what `analyzeProjectVariance`
 * already verified for the `orthogonal-after-probe` classification.
 *
 * The classification work is the value-comparison + targeted-joint-probe
 * pass in `analyzeProjectVariance`. The emitter consumes that analysis
 * and does no spec reasoning of its own — every routing decision is
 * already in the `VarianceInfo` for the token.
 *
 * Output size scales with `baseline + per-axis cells + joint compound
 * blocks`. For mostly-orthogonal fixtures, dramatically smaller than
 * cartesian. In the worst case (every token touched by every axis with
 * joint variance on every pair), output approaches cartesian but never
 * exceeds it.
 *
 * For single-axis projects (a synthetic `theme` axis, or a resolver
 * with one modifier), the cell selector uses the axis's actual name
 * — e.g. `[data-mode="Dark"]`.
 *
 * Public, but scoped to swatchbook's own preview build: this is how the
 * addon produces the stylesheet it injects into Storybook and how the MCP
 * server answers CSS-preview queries — both call it directly through this
 * entry rather than duplicating the emission logic. It is not a
 * general-purpose production CSS emitter; consumers building their own
 * transform pipeline for a shipped platform should drive
 * `@terrazzo/plugin-css` / the Terrazzo CLI against their DTCG sources
 * instead, the same way swatchbook's own preview build does internally.
 */
export function emitAxisProjectedCss(
  project: Project,
  options: EmitAxisProjectedCssOptions = {},
): string {
  const prefix = options.prefix ?? project.config.cssVarPrefix ?? '';
  const varOpts: VarOpts = prefix ? { prefix } : {};
  const transformAlias = (token: TokenNormalized): string =>
    makeCSSVar(token.id, { ...varOpts, wrapVar: true });

  // Mirror plugin-css's value pipeline (see token-listing's build) so the
  // emitted CSS matches the listing previewValue: same legacyHex color
  // output, same user `transform` fallback before transformCSSValue.
  const cssOptions = project.config.cssOptions;
  const customTransform = cssOptions?.transform;
  const color =
    cssOptions?.legacyHex !== undefined ? { legacyHex: cssOptions.legacyHex } : undefined;
  const transformValue: TransformValue = (token, tokensSet, permutation) => {
    const opts = { tokensSet, permutation, transformAlias, ...(color && { color }) };
    return customTransform?.(token, opts) ?? transformCSSValue(token, opts);
  };

  const { axes, tokenGraph } = project;
  const variance = options.variance ?? analyzeProjectVariance(project);

  const defaultTuple = project.defaultTuple;
  // Baseline map from tokenGraph for value-comparison (delta detection).
  // resolveAliasAllAt preserves alias tokens in the Terrazzo-native shape
  // transformCSSValue requires.
  const baselineValues = resolveAllAt(tokenGraph, defaultTuple);
  const baselineTokens = resolveAliasAllAt(tokenGraph, defaultTuple);

  const blocks: string[] = [];

  // 1. Baseline `:root` — every token's baseline value lives here.
  //    Baseline-only tokens never appear elsewhere; all other variance
  //    kinds also need a baseline value to start the cascade from.
  {
    const baselineRaw = withSyntheticIds(baselineTokens);
    const lines = collectLines(
      baselineRaw,
      baselineRaw,
      () => true,
      defaultTuple,
      varOpts,
      transformValue,
    );
    if (lines.length > 0) blocks.push(`:root {\n${lines.join('\n')}\n}`);
  }

  // Pre-compute per-axis delta sets using tokenGraph walks. A path is
  // in a delta cell when its resolved value at that singleton tuple
  // differs from the baseline.
  const deltaPathsByAxis: Record<string, Record<string, Set<string>>> = {};
  for (const axis of axes) {
    const axisDeltaPaths: Record<string, Set<string>> = {};
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const cellValues = resolveAllAt(tokenGraph, cellTuple);
      const delta = new Set<string>();
      for (const [path, token] of Object.entries(cellValues)) {
        if (valueKey(token) !== valueKey(baselineValues[path])) delta.add(path);
      }
      axisDeltaPaths[ctx] = delta;
    }
    deltaPathsByAxis[axis.name] = axisDeltaPaths;
  }

  // 2. Per-axis singleton cells — emit every token this axis touches.
  //    Under smart dedup we don't drop "matches baseline" values; the
  //    cascade needs them to win against other axes that might have
  //    overridden the var. Variance routing makes "touches" precise:
  //    only tokens where `axesTouching(token)` includes this axis emit
  //    here. Baseline-only tokens are filtered out entirely.
  for (const axis of axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const cellTuple = { ...defaultTuple, [axis.name]: ctx };
      const cellTokens = resolveAliasAllAt(tokenGraph, cellTuple);
      const cellTokensForAliases = cellTokens;
      const deltaPaths = deltaPathsByAxis[axis.name]?.[ctx] ?? new Set<string>();

      const lines = collectLines(
        withSyntheticIds(cellTokens),
        withSyntheticIds(cellTokensForAliases),
        (path) => deltaPaths.has(path) && axisTouchesToken(axis.name, variance.get(path)),
        cellTuple,
        varOpts,
        transformValue,
      );
      if (lines.length === 0) continue;
      const selector = `[${dataAttr(prefix, axis.name)}="${cssEscape(ctx)}"]`;
      blocks.push(`${selector} {\n${lines.join('\n')}\n}`);
    }
  }

  // 3. Compound joint cells — drive emission from the per-token joint
  //    cases recorded in `analyzeProjectVariance`. Each joint case is a
  //    partial tuple where cascade composition diverges from cartesian
  //    truth for that specific token; group those cases by tuple to emit
  //    one compound block per unique joint tuple containing every token
  //    that diverges there.
  for (const block of collectJointBlocks(project, variance, prefix, varOpts, transformValue)) {
    blocks.push(block);
  }

  // 4. Chrome aliases — trailing `:root` block.
  const chrome = options.chrome ?? project.chrome;
  const chromeLines: string[] = [];
  for (const role of CHROME_ROLES) {
    const sourceVar = makeCSSVar(role, { prefix: CHROME_VAR_PREFIX });
    const target = chrome[role];
    if (target !== undefined) {
      const targetVar = makeCSSVar(target, { ...varOpts, wrapVar: true });
      chromeLines.push(`  ${sourceVar}: ${targetVar};`);
    } else {
      chromeLines.push(`  ${sourceVar}: ${DEFAULT_CHROME_MAP[role]};`);
    }
  }
  blocks.push(`:root {\n${chromeLines.join('\n')}\n}`);

  return `${blocks.join('\n\n')}\n`;
}

type VarOpts = Record<string, never> | { prefix: string };

// Tells whether the given axis is in a token's touching set. Drives the
// per-axis cell-block filter: only tokens this axis actually affects
// appear in that axis's cell blocks.
function axisTouchesToken(axisName: string, info: VarianceInfo | undefined): boolean {
  if (!info) return false;
  switch (info.kind) {
    case 'baseline-only':
      return false;
    case 'single-axis':
      return info.axis === axisName;
    case 'orthogonal-after-probe':
    case 'joint-variant':
      return info.touching.has(axisName);
    default: {
      const exhaustive: never = info;
      throw new Error(`unhandled VarianceInfo kind: ${JSON.stringify(exhaustive)}`);
    }
  }
}

interface Axis {
  name: string;
  contexts: readonly string[];
  default: string;
}

// Emit one compound `[data-axis="…"][…]` block per unique joint tuple
// that any token in the project diverges at. The set of joint tuples
// comes from `analyzeProjectVariance`'s per-token `jointCases` — no
// cartesian enumeration over project axes is performed. For a token
// with `affectedBy = [A, B]` the only joint tuples probed involve A
// and B; the rest of the project's axes are irrelevant for that token.
//
// Blocks are emitted in arity-ascending order so cascade composition
// resolves correctly: higher-arity blocks override lower-arity blocks
// at the same specificity gradient (n-attribute selectors have
// specificity (0, n, 0); a 3-axis block beats both its constituent
// 2-axis blocks).
function collectJointBlocks(
  project: Project,
  variance: Map<string, VarianceInfo>,
  prefix: string,
  varOpts: VarOpts,
  transformValue: TransformValue,
): string[] {
  const { axes, tokenGraph, defaultTuple } = project;
  if (axes.length < 2) return [];

  const projectAxisOrder = new Map<string, number>(axes.map((a, i) => [a.name, i]));

  // Group joint cases across tokens by canonical tuple key so each
  // unique joint tuple becomes one compound block holding every token
  // that diverges at that tuple.
  interface Grouped {
    tuple: Record<string, string>;
    paths: string[];
  }
  const grouped = new Map<string, Grouped>();
  for (const [path, info] of variance) {
    if (info.kind !== 'joint-variant') continue;
    for (const jc of info.jointCases) {
      const key = canonicalKey(jc.tuple);
      let entry = grouped.get(key);
      if (!entry) {
        entry = { tuple: jc.tuple, paths: [] };
        grouped.set(key, entry);
      }
      entry.paths.push(path);
    }
  }

  // Sort: arity ascending first (cascade requires lower-arity blocks before
  // higher-arity). Within an arity, by project-axis order of the involved
  // axes; within same axes, by context iteration order — a stable emission
  // order keyed off project-axis and context declaration order.
  function emissionSortKey(tuple: Record<string, string>): string {
    const sortedAxes = Object.keys(tuple).toSorted(
      (a, b) => (projectAxisOrder.get(a) ?? 0) - (projectAxisOrder.get(b) ?? 0),
    );
    return sortedAxes
      .map((axisName) => {
        const axisPos = String(projectAxisOrder.get(axisName) ?? 0).padStart(4, '0');
        const ctx = tuple[axisName] ?? '';
        const axis = axes.find((a) => a.name === axisName);
        const ctxPos = String(axis ? axis.contexts.indexOf(ctx) : 0).padStart(4, '0');
        return `${axisPos}.${ctxPos}`;
      })
      .join('|');
  }
  const orderedKeys = [...grouped.keys()].toSorted((a, b) => {
    const entryA = grouped.get(a);
    const entryB = grouped.get(b);
    if (!entryA || !entryB) return 0;
    const aArity = Object.keys(entryA.tuple).length;
    const bArity = Object.keys(entryB.tuple).length;
    if (aArity !== bArity) return aArity - bArity;
    return emissionSortKey(entryA.tuple).localeCompare(emissionSortKey(entryB.tuple));
  });

  const blocks: string[] = [];
  for (const key of orderedKeys) {
    const entry = grouped.get(key);
    if (!entry) continue;
    const fullTuple = { ...defaultTuple, ...entry.tuple };
    const fullTokens = withSyntheticIds(resolveAliasAllAt(tokenGraph, fullTuple));

    // Selector order: project axis order, not the order the entry's
    // tuple happens to be keyed in.
    const sortedEntries = Object.entries(entry.tuple).toSorted(
      ([a], [b]) => (projectAxisOrder.get(a) ?? 0) - (projectAxisOrder.get(b) ?? 0),
    );
    const selector = sortedEntries
      .map(([axisName, ctx]) => `[${dataAttr(prefix, axisName)}="${cssEscape(ctx)}"]`)
      .join('');

    const lines: string[] = [];
    for (const path of entry.paths) {
      const token = fullTokens[path];
      if (!token) continue;
      for (const decl of collectTokenDeclarations(
        path,
        token,
        fullTokens,
        fullTuple,
        varOpts,
        transformValue,
      )) {
        lines.push(`  ${decl.varName}: ${decl.value};`);
      }
    }
    if (lines.length > 0) blocks.push(`${selector} {\n${lines.join('\n')}\n}`);
  }

  return blocks;
}

// Collect emitted declaration lines for a token map, filtering tokens
// by `accept(path)`. Each line is `  --var: value;` (with leading
// indent for embedding in a block). Composite tokens contribute one
// line per sub-field plus an optional shorthand line; primitives
// contribute one line.
//
// `tokensForAliasResolution` is the broader resolution context —
// with delta cells, `tokens` itself only carries the delta paths,
// so composite token sub-aliases need the full composed TokenMap
// to resolve references to non-delta tokens.
function collectLines(
  tokens: RawTokenMap,
  tokensForAliasResolution: RawTokenMap,
  accept: (path: string) => boolean,
  permutation: Record<string, string>,
  varOpts: VarOpts,
  transformValue: TransformValue,
): string[] {
  const lines: string[] = [];
  for (const [path, token] of Object.entries(tokens)) {
    if (!accept(path)) continue;
    for (const decl of collectTokenDeclarations(
      path,
      token,
      tokensForAliasResolution,
      permutation,
      varOpts,
      transformValue,
    )) {
      lines.push(`  ${decl.varName}: ${decl.value};`);
    }
  }
  return lines;
}

/**
 * Expand a single token into its emitted `{ varName, value }` records.
 * Primitive tokens yield one record; composite tokens yield one per
 * sub-field plus an optional shorthand.
 */
export function* collectTokenDeclarations(
  path: string,
  token: TokenNormalized,
  tokensSet: RawTokenMap,
  permutation: Record<string, string>,
  varOpts: VarOpts,
  transformValue: TransformValue,
): Generator<{ varName: string; value: string }> {
  const varName = makeCSSVar(path, varOpts);
  let value: ReturnType<typeof transformCSSValue>;
  try {
    value = transformValue(token, tokensSet, permutation);
  } catch (error) {
    const permutationStr = JSON.stringify(permutation);
    const valueStr = safeStringify(token.$value);
    const original = error instanceof Error ? error.message : String(error);
    throw new Error(
      `swatchbook: failed to transform token "${path}" at permutation ${permutationStr}.\n` +
        `  $type: ${token.$type}\n` +
        `  $value: ${valueStr}\n` +
        `  cause: ${original}`,
      { cause: error },
    );
  }
  if (typeof value === 'string') {
    yield { varName, value };
    return;
  }
  for (const [subKey, subVal] of Object.entries(value)) {
    yield { varName: makeCSSVar(`${path}.${subKey}`, varOpts), value: subVal };
  }
  const shorthand = generateShorthand({ token, localID: path });
  if (shorthand) yield { varName, value: shorthand };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function* axisCombinations(axes: readonly Axis[], k: number): Generator<readonly Axis[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (k > axes.length) return;
  for (let i = 0; i <= axes.length - k; i++) {
    const head = axes[i] as Axis;
    for (const tail of axisCombinations(axes.slice(i + 1), k - 1)) {
      yield [head, ...tail];
    }
  }
}

function* contextProducts(axisCombo: readonly Axis[]): Generator<Record<string, string>> {
  if (axisCombo.length === 0) {
    yield {};
    return;
  }
  const [first, ...rest] = axisCombo;
  if (!first) return;
  for (const ctx of first.contexts) {
    if (ctx === first.default) continue;
    for (const subTuple of contextProducts(rest)) {
      yield { [first.name]: ctx, ...subTuple };
    }
  }
}
