import type { Axis, Diagnostic, ParserInput, SwatchbookToken, TokenMap } from '#/types.ts';
import { permutationID } from '#/types.ts';
import type { TokenGraph, TokenGraphNode, WriteValue } from '#/token-graph/types.ts';
import { valueKey } from '#/value-key.ts';
import { isPlainObject } from '#/token-graph/internal-utils.ts';

const COMPOSITE_TYPES = new Set(['border', 'typography', 'transition', 'gradient', 'shadow']);
const ALIAS_RE = /^\{(.+)\}$/;

export function extractWritesFromModifiers(
  modifiers: Record<
    string,
    { contexts?: Record<string, unknown[]> | undefined; default?: string | undefined }
  >,
  axes: readonly Axis[],
): Record<string, Record<string, Record<string, WriteValue>>> {
  const out: Record<string, Record<string, Record<string, WriteValue>>> = {};
  for (const axis of axes) {
    const modifier = modifiers[axis.name];
    if (!modifier?.contexts) continue;
    for (const [contextName, groupNodes] of Object.entries(modifier.contexts)) {
      if (contextName === axis.default) continue;
      for (const node of groupNodes) {
        collectLeafWrites(node, '', axis.name, contextName, out);
      }
    }
  }
  return out;
}

function collectLeafWrites(
  node: unknown,
  prefix: string,
  axisName: string,
  contextName: string,
  out: Record<string, Record<string, Record<string, WriteValue>>>,
  inheritedType?: string,
): void {
  if (!isPlainObject(node)) return;
  if ('$value' in node) {
    if (!prefix) return;
    const effectiveType = typeof node['$type'] === 'string' ? node['$type'] : inheritedType;
    const write = toWriteValue(node, effectiveType);
    if (write) {
      (out[prefix] ??= {})[axisName] ??= {};
      out[prefix]![axisName]![contextName] = write;
    }
    return;
  }
  const nextInheritedType = typeof node['$type'] === 'string' ? node['$type'] : inheritedType;
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const childPath = prefix ? `${prefix}.${key}` : key;
    collectLeafWrites(child, childPath, axisName, contextName, out, nextInheritedType);
  }
}

function toWriteValue(
  token: Record<string, unknown>,
  effectiveType?: string,
): WriteValue | undefined {
  const value = token['$value'];
  if (value === undefined) return undefined;
  const $type = typeof token['$type'] === 'string' ? token['$type'] : effectiveType;
  const withType: SwatchbookToken =
    $type !== undefined && token['$type'] === undefined
      ? ({ ...token, $type } as SwatchbookToken)
      : (token as SwatchbookToken);
  if (typeof value === 'string') {
    const match = ALIAS_RE.exec(value);
    if (match) return { kind: 'alias', target: match[1]! };
    return { kind: 'literal', value: withType };
  }
  if ($type && COMPOSITE_TYPES.has($type) && (isPlainObject(value) || Array.isArray(value))) {
    const aliasFields: Record<string, string> = {};
    walkPartialAliasFields(value, '', aliasFields);
    if (Object.keys(aliasFields).length > 0) {
      return {
        kind: 'partial-alias',
        baseValue: withType,
        aliasFields,
      };
    }
  }
  return { kind: 'literal', value: withType };
}

// Walks raw DTCG `$value` looking for `{path}`-shaped alias syntax. Used during modifier-source extraction.
function walkPartialAliasFields(value: unknown, prefix: string, out: Record<string, string>): void {
  if (typeof value === 'string') {
    const match = ALIAS_RE.exec(value);
    if (match && prefix) out[prefix] = match[1]!;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, i) =>
      walkPartialAliasFields(entry, prefix ? `${prefix}.${i}` : String(i), out),
    );
    return;
  }
  if (isPlainObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      walkPartialAliasFields(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return;
  }
  // Numbers, booleans, and other primitives carry no alias syntax — skip silently.
}

export interface BuildTokenGraphResult {
  graph: TokenGraph;
  diagnostics: readonly Diagnostic[];
}

export function buildTokenGraph(
  parserInput: ParserInput,
  axes: readonly Axis[],
  defaultTuple: Record<string, string>,
): BuildTokenGraphResult {
  const baseline = parserInput.resolver.apply(defaultTuple);
  const writesByPath = extractWritesFromModifiers(
    parserInput.resolver.source?.modifiers ?? {},
    axes,
  );
  // Singleton-apply sweep: each non-default (axis, ctx) tuple.
  // Records resolved values per singleton so writes-only paths
  // (absent from the default-tuple resolve) get a meaningful
  // baselineValue from the first axis/context they appear in.
  const singletonList: { tuple: Record<string, string>; resolved: TokenMap }[] = [];
  for (const axis of axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const tuple = { ...defaultTuple, [axis.name]: ctx };
      const resolved = parserInput.resolver.apply(tuple);
      singletonList.push({ tuple, resolved });
    }
  }
  return assembleGraph(axes, baseline, writesByPath, singletonList);
}

function findFirstSingletonValue(
  path: string,
  singletons: readonly { tuple: Record<string, string>; resolved: TokenMap }[],
): SwatchbookToken | undefined {
  for (const { resolved } of singletons) {
    if (resolved[path]) return resolved[path];
  }
  return undefined;
}

function assembleGraph(
  axes: readonly Axis[],
  baseline: TokenMap,
  writesByPath: Record<string, Record<string, Record<string, WriteValue>>>,
  singletonList: readonly { tuple: Record<string, string>; resolved: TokenMap }[],
): BuildTokenGraphResult {
  const pathUniverse = new Set<string>([...Object.keys(baseline), ...Object.keys(writesByPath)]);
  for (const { resolved } of singletonList) {
    for (const path of Object.keys(resolved)) pathUniverse.add(path);
  }

  const nodes: Record<string, TokenGraphNode> = {};
  for (const path of pathUniverse) {
    const baselineForNode = baseline[path] ?? findFirstSingletonValue(path, singletonList);
    nodes[path] = buildNode(baselineForNode, writesByPath[path] ?? {});
  }

  const axisDefaults: Record<string, string> = {};
  const axisContexts: Record<string, readonly string[]> = {};
  for (const axis of axes) {
    axisDefaults[axis.name] = axis.default;
    axisContexts[axis.name] = axis.contexts;
  }

  computeAffectedBy(
    nodes,
    axes.map((a) => a.name),
  );

  return {
    graph: { nodes, axes: axes.map((a) => a.name), axisDefaults, axisContexts },
    diagnostics: [],
  };
}

function buildNode(
  baselineToken: SwatchbookToken | undefined,
  writes: Record<string, Record<string, WriteValue>>,
): TokenGraphNode {
  if (!baselineToken) {
    throw new Error(
      'buildTokenGraph: path has writes but no resolvable value at default or any singleton tuple — graph cannot represent it',
    );
  }
  const baselineKind = detectBaselineKind(baselineToken);
  const aliases: string[] = [];
  let baselineAliasTarget: string | undefined;
  let baselinePartialFields: Record<string, string> | undefined;

  if (baselineKind === 'alias') {
    // detectBaselineKind only returns 'alias' when aliasOf is a string
    baselineAliasTarget = baselineToken.aliasOf as string;
    aliases.push(baselineAliasTarget);
  } else if (baselineKind === 'partial-alias') {
    baselinePartialFields = extractPartialAliasFields(baselineToken.partialAliasOf);
    for (const target of Object.values(baselinePartialFields)) aliases.push(target);
  }

  return {
    baselineValue: baselineToken,
    baselineKind,
    ...(baselineAliasTarget !== undefined ? { baselineAliasTarget } : {}),
    ...(baselinePartialFields !== undefined ? { baselinePartialFields } : {}),
    writes,
    affectedBy: [],
    aliases,
    aliasedBy: [],
  };
}

function detectBaselineKind(token: SwatchbookToken): 'literal' | 'alias' | 'partial-alias' {
  if (typeof token.aliasOf === 'string') return 'alias';
  if (token.partialAliasOf !== undefined) return 'partial-alias';
  return 'literal';
}

function extractPartialAliasFields(partialAliasOf: unknown): Record<string, string> {
  const fields: Record<string, string> = {};
  walkPartialAliasTargets(partialAliasOf, '', fields);
  return fields;
}

// Generous cycle guard. Acyclic propagation terminates in at most
// (max alias-chain depth) iterations — 1000 covers any realistic project.
const AFFECTED_BY_FIXPOINT_BOUND = 1000;

export function computeAliasTargets(
  nodes: Record<string, TokenGraphNode>,
): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const [path, node] of Object.entries(nodes)) {
    const targets = new Set<string>(node.aliases);
    for (const axisWrites of Object.values(node.writes)) {
      for (const write of Object.values(axisWrites)) {
        if (write.kind === 'alias') targets.add(write.target);
        else if (write.kind === 'partial-alias') {
          for (const t of Object.values(write.aliasFields)) targets.add(t);
        }
      }
    }
    out[path] = targets;
  }
  return out;
}

export function computeAffectedBy(
  nodes: Record<string, TokenGraphNode>,
  axisOrder: readonly string[],
): void {
  const affected: Record<string, Set<string>> = {};
  for (const [path, node] of Object.entries(nodes)) {
    affected[path] = new Set(Object.keys(node.writes));
  }

  const aliasTargets = computeAliasTargets(nodes);

  let iterations = 0;
  let changed = true;
  while (changed) {
    iterations += 1;
    if (iterations > AFFECTED_BY_FIXPOINT_BOUND) {
      throw new Error(
        `affectedBy fixpoint did not stabilize after ${AFFECTED_BY_FIXPOINT_BOUND} iterations`,
      );
    }
    changed = false;
    for (const [path, targets] of Object.entries(aliasTargets)) {
      for (const target of targets) {
        const targetAffected = affected[target];
        if (!targetAffected) continue;
        for (const axis of targetAffected) {
          if (!affected[path]!.has(axis)) {
            affected[path]!.add(axis);
            changed = true;
          }
        }
      }
    }
  }

  for (const [path, node] of Object.entries(nodes)) {
    (node as { affectedBy: readonly string[] }).affectedBy = axisOrder.filter((a) =>
      affected[path]!.has(a),
    );
  }

  const aliasedBy: Record<string, Set<string>> = {};
  for (const [path, targets] of Object.entries(aliasTargets)) {
    for (const target of targets) {
      (aliasedBy[target] ??= new Set()).add(path);
    }
  }
  for (const [target, set] of Object.entries(aliasedBy)) {
    const node = nodes[target];
    if (node) (node as { aliasedBy: readonly string[] }).aliasedBy = [...set].toSorted();
  }
}

// Walks Terrazzo's already-extracted `partialAliasOf` map where values are bare path strings (no braces). Used during baseline node construction.
function walkPartialAliasTargets(
  value: unknown,
  prefix: string,
  out: Record<string, string>,
): void {
  if (typeof value === 'string') {
    if (prefix) out[prefix] = value;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, i) =>
      walkPartialAliasTargets(entry, prefix ? `${prefix}.${i}` : String(i), out),
    );
    return;
  }
  if (isPlainObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      walkPartialAliasTargets(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return;
  }
  // partialAliasOf values are strings or nested structures; primitives carry no path data.
}

/**
 * Build a token-graph from layered/per-tuple resolved output (no resolver
 * source available). Used for layered configs.
 *
 * Plain-parse projects do NOT route here — they go through `buildTokenGraph`
 * via a synthetic resolver constructed by `loadResolverPermutations`.
 *
 * Writes are inferred by diffing each singleton's resolved TokenMap
 * against the baseline: any path whose value differs from the baseline
 * yields a WriteValue derived from the singleton token's alias metadata.
 *
 * @param axes - Project axes (post-disabledAxes filter).
 * @param baseline - Resolved TokenMap for the default tuple.
 * @param perSingletonResolved - All per-tuple resolved maps, keyed by
 *   `permutationID(tuple)`. The function only reads singleton tuples
 *   (one non-default axis at a time); joint tuples in the map are ignored.
 * @param defaultTuple - The project's default tuple (axisName → defaultContext).
 */
export function buildTokenGraphFromLayered(
  axes: readonly Axis[],
  baseline: TokenMap,
  perSingletonResolved: Readonly<Record<string, TokenMap>>,
  defaultTuple: Readonly<Record<string, string>>,
): BuildTokenGraphResult {
  const writesByPath = extractWritesFromLayeredSingletons(
    axes,
    baseline,
    perSingletonResolved,
    defaultTuple,
  );
  const singletonList: { tuple: Record<string, string>; resolved: TokenMap }[] = [];
  for (const axis of axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const singletonTuple = { ...defaultTuple, [axis.name]: ctx };
      const resolved = perSingletonResolved[permutationID(singletonTuple)];
      if (resolved) singletonList.push({ tuple: singletonTuple, resolved });
    }
  }
  return assembleGraph(axes, baseline, writesByPath, singletonList);
}

function extractWritesFromLayeredSingletons(
  axes: readonly Axis[],
  baseline: TokenMap,
  perSingletonResolved: Readonly<Record<string, TokenMap>>,
  defaultTuple: Readonly<Record<string, string>>,
): Record<string, Record<string, Record<string, WriteValue>>> {
  const out: Record<string, Record<string, Record<string, WriteValue>>> = {};
  for (const axis of axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const singletonTuple = { ...defaultTuple, [axis.name]: ctx };
      const id = permutationID(singletonTuple);
      const resolved = perSingletonResolved[id];
      if (!resolved) continue;
      for (const [path, token] of Object.entries(resolved)) {
        const baselineToken = baseline[path];
        const sameAsBaseline =
          baselineToken !== undefined && valueKey(token) === valueKey(baselineToken);
        const writeValue = toWriteValueFromResolvedToken(token);
        // Always record alias-shape writes — even when they happen to resolve to
        // the same value at this singleton, the alias target may differ from
        // baseline's, and that difference matters at joint tuples where the
        // target's value diverges. Only literal writes can be safely skipped on
        // value coincidence (a literal == literal at all tuples it applies to).
        if (writeValue.kind === 'literal' && sameAsBaseline) continue;
        if (
          writeValue.kind === 'alias' &&
          typeof baselineToken?.aliasOf === 'string' &&
          baselineToken.aliasOf === writeValue.target &&
          sameAsBaseline
        )
          continue;
        // partial-alias: rare for both sides to have identical aliasFields; just always record
        (out[path] ??= {})[axis.name] ??= {};
        out[path]![axis.name]![ctx] = writeValue;
      }
    }
  }
  return out;
}

function toWriteValueFromResolvedToken(token: SwatchbookToken): WriteValue {
  if (typeof token.aliasOf === 'string') {
    return { kind: 'alias', target: token.aliasOf };
  }
  if (token.partialAliasOf !== undefined) {
    return {
      kind: 'partial-alias',
      baseValue: token,
      aliasFields: extractPartialAliasFields(token.partialAliasOf),
    };
  }
  return { kind: 'literal', value: token };
}
