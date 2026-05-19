import type { Axis, SwatchbookToken } from '#/types.ts';
import type { WriteValue } from '#/token-graph/types.ts';

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
): void {
  if (!isPlainObject(node)) return;
  if ('$value' in node) {
    if (!prefix) return;
    const write = toWriteValue(node);
    if (write) {
      (out[prefix] ??= {})[axisName] ??= {};
      out[prefix]![axisName]![contextName] = write;
    }
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const childPath = prefix ? `${prefix}.${key}` : key;
    collectLeafWrites(child, childPath, axisName, contextName, out);
  }
}

function toWriteValue(token: Record<string, unknown>): WriteValue | undefined {
  const value = token['$value'];
  if (value === undefined) return undefined;
  if (typeof value === 'string') {
    const match = ALIAS_RE.exec(value);
    if (match) return { kind: 'alias', target: match[1]! };
    return { kind: 'literal', value: token as SwatchbookToken };
  }
  const $type = typeof token['$type'] === 'string' ? token['$type'] : undefined;
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
