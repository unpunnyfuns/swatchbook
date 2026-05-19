import type { SwatchbookToken, TokenMap } from '#/types.ts';
import type { TokenGraph, WriteValue } from '#/token-graph/types.ts';
import { canonicalKey } from '#/tuple-key.ts';

const CYCLE_SENTINEL: unique symbol = Symbol('cycle');

export function resolveAt(
  graph: TokenGraph,
  path: string,
  tuple: Record<string, string>,
  memo?: Map<string, SwatchbookToken | typeof CYCLE_SENTINEL>,
): SwatchbookToken | undefined {
  const node = graph.nodes[path];
  if (!node) return undefined;

  const ownMemo = memo ?? new Map<string, SwatchbookToken | typeof CYCLE_SENTINEL>();
  const cacheKey = path + ' ' + canonicalKey(tuple);

  // Fast path: constant token — no axis in tuple is non-default for this node.
  if (node.affectedBy.length === 0) {
    ownMemo.set(cacheKey, node.baselineValue);
    return node.baselineValue;
  }
  const hasNonDefaultAxis = node.affectedBy.some(
    (axis) => tuple[axis] !== undefined && tuple[axis] !== graph.axisDefaults[axis],
  );
  if (!hasNonDefaultAxis) {
    ownMemo.set(cacheKey, node.baselineValue);
    return node.baselineValue;
  }

  const cached = ownMemo.get(cacheKey);
  if (cached !== undefined) {
    if (cached === CYCLE_SENTINEL) return node.baselineValue;
    return cached;
  }

  ownMemo.set(cacheKey, CYCLE_SENTINEL);

  // Find the last-wins direct write across axes in project order.
  let matchedWrite: WriteValue | undefined = undefined;
  for (const axis of graph.axes) {
    const ctx = tuple[axis];
    if (ctx === undefined || ctx === graph.axisDefaults[axis]) continue;
    const axisWrites = node.writes[axis];
    if (!axisWrites) continue;
    const write = axisWrites[ctx];
    if (write !== undefined) matchedWrite = write;
  }

  let result: SwatchbookToken | undefined;

  if (matchedWrite === undefined) {
    // No direct write — resolve baseline structure.
    if (node.baselineKind === 'literal') {
      result = node.baselineValue;
    } else if (node.baselineKind === 'alias') {
      result = resolveAt(graph, node.baselineAliasTarget!, tuple, ownMemo);
    } else {
      result = composePartial(
        graph,
        node.baselineValue,
        node.baselinePartialFields!,
        tuple,
        ownMemo,
      );
    }
  } else {
    // Direct write applies — resolve per write kind.
    if (matchedWrite.kind === 'literal') {
      result = matchedWrite.value;
    } else if (matchedWrite.kind === 'alias') {
      result = resolveAt(graph, matchedWrite.target, tuple, ownMemo);
    } else {
      result = composePartial(
        graph,
        matchedWrite.baseValue,
        matchedWrite.aliasFields,
        tuple,
        ownMemo,
      );
    }
  }

  if (result !== undefined) ownMemo.set(cacheKey, result);
  return result;
}

export function resolveAllAt(graph: TokenGraph, tuple: Record<string, string>): TokenMap {
  const memo = new Map<string, SwatchbookToken | typeof CYCLE_SENTINEL>();
  const result: TokenMap = {};
  for (const path of Object.keys(graph.nodes)) {
    const value = resolveAt(graph, path, tuple, memo);
    if (value !== undefined) result[path] = value;
  }
  return result;
}

/**
 * Like `resolveAt`, but stops at the first alias/partial-alias write
 * (or baseline structure) and returns the alias view instead of
 * recursing to a leaf. Returned token retains the source path's
 * structural shape — useful for emitters that need to reference
 * `aliasOf` to emit `var(--…)` references rather than literal values.
 *
 * - Literal at this tuple → returns the literal token (same as `resolveAt`).
 * - Alias at this tuple → returns a token with `aliasOf: <target>` and
 *   `$value: <target's resolved leaf at this tuple>` (preserves alias provenance).
 * - Partial-alias at this tuple → returns a token with `partialAliasOf: <fields-map>`
 *   and `$value: <composed value>` (preserves which fields are aliased).
 */
export function resolveAliasAt(
  graph: TokenGraph,
  path: string,
  tuple: Record<string, string>,
): SwatchbookToken | undefined {
  const node = graph.nodes[path];
  if (!node) return undefined;

  let directWrite: WriteValue | undefined;
  for (const axis of graph.axes) {
    const ctx = tuple[axis];
    if (!ctx || ctx === graph.axisDefaults[axis]) continue;
    const w = node.writes[axis]?.[ctx];
    if (w) directWrite = w;
  }

  if (!directWrite) {
    if (node.baselineKind === 'literal') return node.baselineValue;
    if (node.baselineKind === 'alias') {
      const aliasTarget = node.baselineAliasTarget!;
      const targetLeaf = resolveAt(graph, aliasTarget, tuple);
      return {
        ...node.baselineValue,
        aliasOf: aliasTarget,
        aliasChain: [aliasTarget],
        $value: targetLeaf?.$value,
      };
    }
    // Partial-alias baseline: preserve the original partialAliasOf structure from
    // node.baselineValue (nested, as transformCSSValue expects), only refresh $value.
    const composed = resolveAt(graph, path, tuple);
    return {
      ...node.baselineValue,
      $value: composed?.$value,
    };
  }

  if (directWrite.kind === 'literal') return { ...node.baselineValue, ...directWrite.value };
  if (directWrite.kind === 'alias') {
    const targetLeaf = resolveAt(graph, directWrite.target, tuple);
    return {
      ...node.baselineValue,
      aliasOf: directWrite.target,
      aliasChain: [directWrite.target],
      $value: targetLeaf?.$value,
    };
  }
  const composed = composePartial(
    graph,
    directWrite.baseValue,
    directWrite.aliasFields,
    tuple,
    new Map(),
  );
  return {
    ...node.baselineValue,
    ...directWrite.baseValue,
    partialAliasOf: directWrite.aliasFields,
    $value: composed.$value,
  };
}

export function resolveAliasAllAt(graph: TokenGraph, tuple: Record<string, string>): TokenMap {
  const result: TokenMap = {};
  for (const path of Object.keys(graph.nodes)) {
    const value = resolveAliasAt(graph, path, tuple);
    if (value !== undefined) result[path] = value;
  }
  return result;
}

export function composePartial(
  graph: TokenGraph,
  base: SwatchbookToken,
  fields: Record<string, string>,
  tuple: Record<string, string>,
  memo: Map<string, SwatchbookToken | typeof CYCLE_SENTINEL>,
): SwatchbookToken {
  const result = { ...base };
  const baseValue = base.$value;
  let value: unknown;
  if (Array.isArray(baseValue)) {
    value = [...baseValue].map((v) => (isPlainObject(v) ? { ...v } : v));
  } else if (isPlainObject(baseValue)) {
    value = { ...baseValue };
  } else {
    value = baseValue;
  }

  for (const [fieldPath, targetPath] of Object.entries(fields)) {
    const resolved = resolveAt(graph, targetPath, tuple, memo);
    if (resolved?.$value !== undefined) {
      assignByPath(value as object, fieldPath, resolved.$value);
    }
  }

  result.$value = value;
  return result;
}

function assignByPath(obj: object, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (Array.isArray(cur)) {
      const idx = Number(part);
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return;
      if (Array.isArray(cur[idx])) cur[idx] = [...(cur[idx] as unknown[])];
      else if (cur[idx] && typeof cur[idx] === 'object') cur[idx] = { ...(cur[idx] as object) };
      cur = cur[idx];
    } else if (cur && typeof cur === 'object') {
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') return;
      const rec = cur as Record<string, unknown>;
      if (Array.isArray(rec[part])) rec[part] = [...(rec[part] as unknown[])];
      else if (rec[part] && typeof rec[part] === 'object') rec[part] = { ...(rec[part] as object) };
      cur = rec[part];
    } else {
      return;
    }
  }
  const finalPart = parts[parts.length - 1]!;
  if (Array.isArray(cur)) {
    const idx = Number(finalPart);
    if (Number.isInteger(idx) && idx >= 0 && idx < cur.length) (cur as unknown[])[idx] = value;
  } else if (cur && typeof cur === 'object') {
    if (finalPart === '__proto__' || finalPart === 'constructor' || finalPart === 'prototype')
      return;
    Object.defineProperty(cur, finalPart, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
