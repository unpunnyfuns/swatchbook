/**
 * Deterministic generator for the stress-scale benchmark fixture.
 *
 * Models a realistic consumer scale (matching the shape at
 * https://torquens.bill.works/token-adventure/): 6 modifier axes with
 * small context counts, a few hundred tokens of mixed types, partial
 * overlay density per modifier-context, and a small alias chain depth
 * so each `resolver.apply` does real graph-rebuild work.
 *
 * No joint divergences are seeded — every modifier-context overlay is
 * a primitive redefinition, so cell-composition (last-wins) and
 * `resolver.apply` always agree. `probeJointOverrides` should find
 * zero overrides; the bench then measures the COST of those probes
 * (the work an alias-graph optimisation would elide).
 *
 * Run:
 *   node packages/core/bench/fixtures/stress/gen.mts
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE_VERSION = '2.0.0';
const SEED_STRING = 'swatchbook-stress-2026';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface AxisDef {
  name: string;
  contexts: readonly string[];
}

// Axis shape mirrors the friend's torquens.bill.works/token-adventure demo:
// 6 modifiers with small context counts. First context in each list is the
// default; resolution order = array order.
const AXES: readonly AxisDef[] = [
  { name: 'disabled', contexts: ['enabled', 'disabled'] },
  { name: 'forced', contexts: ['standard', 'forced'] },
  { name: 'container', contexts: ['panel', 'control-primary', 'control-secondary'] },
  { name: 'sentiment', contexts: ['neutral', 'positive', 'negative', 'warning'] },
  { name: 'state', contexts: ['default', 'hover', 'active'] },
  { name: 'mode', contexts: ['light', 'dark'] },
];

const TOTAL_TOKENS = 200;
const ALIAS_FRACTION = 0.4; // 40% of tokens are aliases to other tokens
const OVERLAY_DENSITY = 0.3; // each modifier-context overlay redefines ~30% of tokens

interface TypeMix {
  type: string;
  fraction: number;
}
const TYPE_MIX: readonly TypeMix[] = [
  { type: 'color', fraction: 0.5 },
  { type: 'dimension', fraction: 0.2 },
  { type: 'fontWeight', fraction: 0.1 },
  { type: 'duration', fraction: 0.1 },
  { type: 'number', fraction: 0.1 },
];

function lcgFromString(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  if (state === 0) state = 1;
  return function next(): number {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const rng = lcgFromString(SEED_STRING);

function pickType(): string {
  const r = rng();
  let acc = 0;
  for (const { type, fraction } of TYPE_MIX) {
    acc += fraction;
    if (r < acc) return type;
  }
  return TYPE_MIX[TYPE_MIX.length - 1]!.type;
}

interface NestedTokenGroup {
  [key: string]: NestedTokenGroup | { $type?: string; $value: unknown };
}

function placeToken(
  root: NestedTokenGroup,
  path: string,
  $type: string,
  $value: unknown,
): void {
  const segments = path.split('.');
  let node = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i] as string;
    const existing = node[seg];
    if (!existing || typeof existing !== 'object' || '$value' in existing) {
      const fresh: NestedTokenGroup = {};
      node[seg] = fresh;
      node = fresh;
    } else {
      node = existing as NestedTokenGroup;
    }
  }
  const leaf = segments[segments.length - 1] as string;
  node[leaf] = { $type, $value };
}

function primitiveValue($type: string): unknown {
  switch ($type) {
    case 'color':
      return { colorSpace: 'srgb', components: [rng(), rng(), rng()] };
    case 'dimension':
      return { value: 4 + Math.floor(rng() * 60), unit: 'px' };
    case 'fontWeight':
      return [100, 200, 300, 400, 500, 600, 700, 800, 900][Math.floor(rng() * 9)]!;
    case 'duration':
      return { value: 50 + Math.floor(rng() * 500), unit: 'ms' };
    case 'number':
      return Math.floor(rng() * 100) / 10;
    default:
      return 0;
  }
}

interface TokenSpec {
  path: string;
  $type: string;
  /** True if this token's base-set value is a primitive (overlay-safe). */
  primitive: boolean;
}

/**
 * Generate one base-set entry per token. Some are primitives; others
 * are aliases pointing at a primitive token in the same set. Each
 * alias resolves through one or two hops at apply time, which exercises
 * Terrazzo's alias-resolution work without exploding the graph.
 *
 * `spec.primitive` flags whether the base-set value is primitive-shaped.
 * Modifier overlays only redefine primitive-shaped paths: redefining
 * an alias-shaped base with a primitive-shaped overlay triggers
 * Terrazzo's destructiveMerge to crash (object-into-string).
 */
function buildSpecsAndBase(): {
  specs: readonly TokenSpec[];
  set: NestedTokenGroup;
} {
  const specs: TokenSpec[] = [];
  const set: NestedTokenGroup = {};

  // Per-type primitive token pools — aliases must point at a token of
  // the same DTCG type to keep the parser happy.
  const primitivesByType = new Map<string, string[]>();
  for (let i = 0; i < TOTAL_TOKENS; i++) {
    const $type = pickType();
    const path = `${$type}.t${String(i).padStart(3, '0')}`;
    const list = primitivesByType.get($type) ?? [];
    // Force the first ~10 tokens per type to be primitive so aliases
    // later have a target to point at.
    const asPrimitive = list.length < 10 || rng() >= ALIAS_FRACTION;
    if (asPrimitive) {
      placeToken(set, path, $type, primitiveValue($type));
      list.push(path);
      primitivesByType.set($type, list);
    } else {
      const target = list[Math.floor(rng() * list.length)] as string;
      placeToken(set, path, $type, `{${target}}`);
    }
    specs.push({ path, $type, primitive: asPrimitive });
  }
  return { specs, set };
}

/**
 * For each non-default modifier-context, emit a cell file that
 * redefines a random subset of tokens with fresh primitive values.
 * Primitive overlays compose correctly under last-wins, so the probe
 * finds zero joint divergences — which is the structural property
 * we're measuring "wasted work" against.
 */
function buildModifierOverlays(specs: readonly TokenSpec[]): {
  axisIdx: number;
  ctxIdx: number;
  overlay: NestedTokenGroup;
}[] {
  const overlays: { axisIdx: number; ctxIdx: number; overlay: NestedTokenGroup }[] = [];
  for (let axisIdx = 0; axisIdx < AXES.length; axisIdx++) {
    const axis = AXES[axisIdx]!;
    for (let ctxIdx = 1; ctxIdx < axis.contexts.length; ctxIdx++) {
      const overlay: NestedTokenGroup = {};
      for (const spec of specs) {
        if (!spec.primitive) continue;
        if (rng() < OVERLAY_DENSITY) {
          placeToken(overlay, spec.path, spec.$type, primitiveValue(spec.$type));
        }
      }
      overlays.push({ axisIdx, ctxIdx, overlay });
    }
  }
  return overlays;
}

interface ResolverManifest {
  $schema: string;
  version: string;
  name: string;
  description: string;
  sets: Record<string, { description: string; sources: { $ref: string }[] }>;
  modifiers: Record<
    string,
    {
      description: string;
      contexts: Record<string, { $ref: string }[]>;
      default: string;
    }
  >;
  resolutionOrder: { $ref: string }[];
}

function buildResolverManifest(): ResolverManifest {
  const modifiers: ResolverManifest['modifiers'] = {};
  for (let axisIdx = 0; axisIdx < AXES.length; axisIdx++) {
    const axis = AXES[axisIdx]!;
    const contexts: Record<string, { $ref: string }[]> = {};
    for (let ctxIdx = 0; ctxIdx < axis.contexts.length; ctxIdx++) {
      const ctx = axis.contexts[ctxIdx] as string;
      contexts[ctx] =
        ctxIdx === 0 ? [] : [{ $ref: `./modifiers/${axis.name}/${ctx}.json` }];
    }
    modifiers[axis.name] = {
      description: `Stress fixture modifier ${axis.name}.`,
      contexts,
      default: axis.contexts[0]!,
    };
  }
  const resolutionOrder: { $ref: string }[] = [
    { $ref: '#/sets/base' },
    ...AXES.map((a) => ({ $ref: `#/modifiers/${a.name}` })),
  ];
  return {
    $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
    version: '2025.10',
    name: 'swatchbook-stress',
    description: `Stress fixture v${FIXTURE_VERSION}: realistic 6-axis shape matching the torquens.bill.works/token-adventure demo. ${TOTAL_TOKENS} tokens (~${Math.round(ALIAS_FRACTION * 100)}% aliases), ${AXES.length} modifiers with ${AXES.map((a) => a.contexts.length).join('/')} contexts. Each non-default modifier-context overlay redefines ~${Math.round(OVERLAY_DENSITY * 100)}% of tokens with primitive values; no joint divergences seeded so probeJointOverrides should produce zero overrides. Generated from gen.mts (seed "${SEED_STRING}").`,
    sets: {
      base: {
        description: 'Base set — mixed primitive + alias tokens across DTCG types.',
        sources: [{ $ref: './sets/base.json' }],
      },
    },
    modifiers,
    resolutionOrder,
  };
}

function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function main(): void {
  const outDir = __dirname;
  for (const sub of ['sets', 'modifiers']) {
    rmSync(join(outDir, sub), { recursive: true, force: true });
  }
  rmSync(join(outDir, 'resolver.json'), { force: true });

  const { specs, set } = buildSpecsAndBase();
  const overlays = buildModifierOverlays(specs);

  writeJson(join(outDir, 'sets', 'base.json'), set);
  for (const { axisIdx, ctxIdx, overlay } of overlays) {
    const axis = AXES[axisIdx]!;
    const ctx = axis.contexts[ctxIdx] as string;
    writeJson(join(outDir, 'modifiers', axis.name, `${ctx}.json`), overlay);
  }
  writeJson(join(outDir, 'resolver.json'), buildResolverManifest());

  const cartesianCount = AXES.reduce((n, a) => n * a.contexts.length, 1);
  // eslint-disable-next-line no-console
  console.log(
    `Generated stress fixture v${FIXTURE_VERSION}: ${AXES.length} axes (${AXES.map((a) => `${a.name}=${a.contexts.length}`).join(', ')}), ${specs.length} tokens, ${overlays.length} non-default modifier cells, ${cartesianCount} cartesian permutations.`,
  );
}

main();
