import type { Axis, Diagnostic, ParserInput, SwatchbookToken, TokenMap } from '#/types.ts';
import type { TokenGraph, TokenGraphNode, WriteValue } from '#/token-graph/types.ts';

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
  if (typeof value === 'string') {
    const match = ALIAS_RE.exec(value);
    if (match) return { kind: 'alias', target: match[1]! };
    return { kind: 'literal', value: token as SwatchbookToken };
  }
  const $type = typeof token['$type'] === 'string' ? token['$type'] : effectiveType;
  if ($type && COMPOSITE_TYPES.has($type) && (isPlainObject(value) || Array.isArray(value))) {
    const aliasFields: Record<string, string> = {};
    walkPartialAliasFields(value, '', aliasFields);
    if (Object.keys(aliasFields).length > 0) {
      const baseValue: SwatchbookToken = {
        ...token,
        $value: stripAliasFields(value, aliasFields),
      } as SwatchbookToken;
      return { kind: 'partial-alias', baseValue, aliasFields };
    }
  }
  return { kind: 'literal', value: token as SwatchbookToken };
}

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

function stripAliasFields(value: object, aliasFields: Record<string, string>): unknown {
  const result: unknown = Array.isArray(value) ? [...value] : { ...value };
  for (const fieldPath of Object.keys(aliasFields)) {
    const parts = fieldPath.split('.');
    let cur: unknown = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (Array.isArray(cur)) {
        const idx = Number(part);
        if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) {
          cur = undefined;
          break;
        }
        const child = cur[idx];
        if (Array.isArray(child)) cur[idx] = [...child];
        else if (isPlainObject(child)) cur[idx] = { ...child };
        else {
          cur = undefined;
          break;
        }
        cur = cur[idx];
      } else if (isPlainObject(cur)) {
        const child = cur[part];
        if (Array.isArray(child)) cur[part] = [...child];
        else if (isPlainObject(child)) cur[part] = { ...child };
        else {
          cur = undefined;
          break;
        }
        cur = cur[part];
      } else {
        cur = undefined;
        break;
      }
    }
    if (cur === undefined) continue;
    const finalPart = parts[parts.length - 1]!;
    if (Array.isArray(cur)) {
      const idx = Number(finalPart);
      if (Number.isInteger(idx) && idx >= 0 && idx < cur.length) {
        delete cur[idx];
      }
    } else if (isPlainObject(cur)) {
      delete cur[finalPart];
    }
  }
  return result;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
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
  const pathUniverse = new Set<string>(Object.keys(baseline));
  const singletonResolves: { tuple: Record<string, string>; resolved: TokenMap }[] = [];
  for (const axis of axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      const tuple = { ...defaultTuple, [axis.name]: ctx };
      const resolved = parserInput.resolver.apply(tuple);
      singletonResolves.push({ tuple, resolved });
      for (const path of Object.keys(resolved)) pathUniverse.add(path);
    }
  }
  for (const path of Object.keys(writesByPath)) pathUniverse.add(path);

  const nodes: Record<string, TokenGraphNode> = {};
  for (const path of pathUniverse) {
    const baselineForNode = baseline[path] ?? findFirstSingletonValue(path, singletonResolves);
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

function findFirstSingletonValue(
  path: string,
  singletons: readonly { tuple: Record<string, string>; resolved: TokenMap }[],
): SwatchbookToken | undefined {
  for (const { resolved } of singletons) {
    if (resolved[path]) return resolved[path];
  }
  return undefined;
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
