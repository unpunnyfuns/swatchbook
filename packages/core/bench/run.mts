/**
 * Phase-partitioned benchmark harness for the stress-scale fixture.
 *
 * Imports the loader's exported sub-phases directly (no `loadProject`
 * orchestration), times each, counts `resolver.apply` invocations
 * separately for cell construction and the joint-pair probe.
 *
 * Resilient to per-phase failures: each phase logs its start/end to
 * stdout AND to `phase-log.txt` before proceeding. If a phase OOMs or
 * hangs, the log file tells you exactly which one. Writes
 * `baseline.json` once the run completes; on failure, leaves the
 * partial log in place so the failure mode is the artifact.
 *
 * Run:
 *   node packages/core/bench/run.mts
 *   node --max-old-space-size=8192 packages/core/bench/run.mts  # for stress fixture
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BufferedLogger } from '#/diagnostics.ts';
import { buildCells } from '#/cells.ts';
import { computeTokenListing } from '#/token-listing.ts';
import { probeJointOverrides } from '#/joint-overrides.ts';
import { buildResolveAt } from '#/resolve-at.ts';
import { buildVarianceByPath } from '#/variance-by-path.ts';
import { permutationID } from '#/types.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import { wrapResolver } from './resolver-counter.ts';
import { emitAxisProjectedCss } from '#/css-axis-projected.ts';
import { snapshotForWire } from '#/snapshot-for-wire.ts';
import type { Config, TokenMap } from '#/types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, 'fixtures/stress');
const BASELINE_PATH = join(__dirname, 'baseline.json');
const LOG_PATH = join(__dirname, 'phase-log.txt');

interface PhaseTimings {
  parse: number;
  buildCells: number;
  probe: number;
  variance: number;
  listing: number;
  snapshotWire: number;
  emitCss: number;
}

interface Baseline {
  fixtureVersion: string;
  node: string;
  generatedAt: string;
  loadMs: PhaseTimings & { total: number };
  resolverApplyCount: { atCells: number; atProbe: number; total: number };
  wireBytes: number;
  cssBytes: number;
  jointOverrideCount: number;
  axisCount: number;
  defaultTokenCount: number;
  errors: Record<string, string>;
}

const FIXTURE_VERSION = '2.0.0';

function logPhase(line: string): void {
  const stamp = new Date().toISOString();
  const out = `[${stamp}] ${line}`;
  // eslint-disable-next-line no-console
  console.log(out);
  appendFileSync(LOG_PATH, `${out}\n`);
}

async function timed<T>(label: string, fn: () => Promise<T> | T): Promise<{ result: T; ms: number }> {
  logPhase(`${label}: start`);
  const t0 = process.hrtime.bigint();
  const result = await fn();
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1_000_000;
  logPhase(`${label}: done in ${ms.toFixed(2)}ms`);
  return { result, ms };
}

async function timedSafe<T>(
  label: string,
  fn: () => Promise<T> | T,
  fallback: T,
): Promise<{ result: T; ms: number; error: string | null }> {
  logPhase(`${label}: start`);
  const t0 = process.hrtime.bigint();
  try {
    const result = await fn();
    const t1 = process.hrtime.bigint();
    const ms = Number(t1 - t0) / 1_000_000;
    logPhase(`${label}: done in ${ms.toFixed(2)}ms`);
    return { result, ms, error: null };
  } catch (err) {
    const t1 = process.hrtime.bigint();
    const ms = Number(t1 - t0) / 1_000_000;
    const msg = err instanceof Error ? err.message : String(err);
    logPhase(`${label}: FAILED after ${ms.toFixed(2)}ms — ${msg}`);
    return { result: fallback, ms, error: msg };
  }
}

async function main(): Promise<void> {
  writeFileSync(LOG_PATH, '');
  logPhase(`bench start | node ${process.version} | fixture v${FIXTURE_VERSION}`);

  const config: Config = { resolver: 'resolver.json' };
  const logger = new BufferedLogger({ level: 'warn' });

  // Phase: normalize / parse. Includes Terrazzo's `loadResolver` (manifest
  // parse + permutation listing) + the 65-call singleton-enumeration loop.
  const { result: normalized, ms: parseMs } = await timed('parse', () =>
    normalizePermutations(config, FIXTURE_DIR, logger),
  );

  if (!normalized.parserInput?.resolver) {
    throw new Error('stress fixture must produce a resolver-backed project');
  }

  // Wrap the resolver so we can count `.apply` calls. Reset the counter
  // before each phase to partition cost.
  const counted = wrapResolver(normalized.parserInput.resolver);

  // Default-tuple resolved tokens. Singleton enumeration produces this
  // already, but mirror loadProject's fallback logic to stay realistic.
  const defaultTuple: Record<string, string> = {};
  for (const axis of normalized.axes) defaultTuple[axis.name] = axis.default;
  const defaultId = permutationID(defaultTuple);
  const defaultTokens: TokenMap =
    normalized.resolved[defaultId] ?? counted.resolver.apply(defaultTuple);

  // Phase: buildCells. Each non-default cell is one `resolver.apply` call
  // via the wrapped resolver, so this is where the per-cell apply cost
  // accumulates.
  counted.reset();
  const resolveTuple = (tuple: Readonly<Record<string, string>>): TokenMap =>
    counted.resolver.apply(tuple as Record<string, string>);
  const { result: cells, ms: buildCellsMs } = await timed('buildCells', () =>
    buildCells(normalized.axes, resolveTuple, defaultTuple),
  );
  const applyCountAtCells = counted.getCount();
  logPhase(`buildCells: resolver.apply count = ${applyCountAtCells}`);

  // Phase: probeJointOverrides. This is the suspected hot path —
  // pair-by-context-product applies that scale as `Σ pairs × ctx_a × ctx_b`.
  // Default sweep (all arities); at extreme axis counts this OOMs, but
  // at the realistic 6-axis fixture it completes in seconds.
  counted.reset();
  const { result: probeResult, ms: probeMs } = await timed('probe', () =>
    probeJointOverrides(normalized.axes, cells, defaultTuple, counted.resolver),
  );
  const applyCountAtProbe = counted.getCount();
  const { overrides: jointOverrides, jointTouching } = probeResult;
  logPhase(
    `probe: resolver.apply count = ${applyCountAtProbe}, jointOverrides = ${jointOverrides.length}`,
  );

  // Phase: variance. Pure cells + jointTouching analysis, no resolver calls.
  const baselineForVariance =
    normalized.axes[0] !== undefined
      ? (cells[normalized.axes[0].name]?.[normalized.axes[0].default] ?? defaultTokens)
      : defaultTokens;
  const { result: varianceByPath, ms: varianceMs } = await timed('variance', () =>
    buildVarianceByPath(normalized.axes, cells, jointTouching, baselineForVariance),
  );

  // Phase: listing. Uses the parser input + the cssVarPrefix; produces
  // path-indexed `ListedToken` data.
  const { result: listingResult, ms: listingMs } = await timed('listing', () =>
    computeTokenListing(normalized.parserInput!, FIXTURE_DIR, 'swatch', {}),
  );

  // Build the same `resolveAt` `loadProject` would, for downstream emit.
  const resolveAt = buildResolveAt(normalized.axes, cells, jointOverrides, defaultTuple);

  // Assemble a synthetic `Project` shape sufficient for snapshotForWire +
  // emitAxisProjectedCss. The bench bypasses `loadProject` but its outputs
  // share the wire/emit consumer surface.
  const project = {
    config: { ...config, cssVarPrefix: 'swatch' },
    axes: normalized.axes,
    disabledAxes: [] as string[],
    presets: [] as never[],
    chrome: new Map(),
    defaultTokens,
    cells,
    jointOverrides,
    defaultTuple,
    resolveAt,
    varianceByPath,
    sourceFiles: normalized.sourceFiles,
    cwd: FIXTURE_DIR,
    listing: listingResult,
    diagnostics: [] as never[],
    parserInput: normalized.parserInput,
  } as unknown as Parameters<typeof snapshotForWire>[0];

  // Phase: emit CSS. The smart emitter walks variance + cells + joints.
  const { result: css, ms: emitCssMs, error: emitCssError } = await timedSafe(
    'emitCss',
    () => emitAxisProjectedCss(project),
    '',
  );

  // Phase: snapshot-for-wire. Marshals the project for wire transport;
  // captures the JSON payload size the addon would ship to the preview.
  // Some core helpers (slimListing) assume every listing entry has the
  // Terrazzo plugin extension; synthetic fixtures may lack it. Tolerate
  // the failure so the rest of the baseline still lands.
  const { result: wireSnapshot, ms: snapshotWireMs, error: snapshotWireError } =
    await timedSafe('snapshotWire', () => snapshotForWire(project, css), null);

  const wireBytes = wireSnapshot
    ? Buffer.byteLength(JSON.stringify(wireSnapshot), 'utf8')
    : 0;
  const cssBytes = Buffer.byteLength(css, 'utf8');

  const total = parseMs + buildCellsMs + probeMs + varianceMs + listingMs + emitCssMs + snapshotWireMs;

  const errors: Record<string, string> = {};
  if (emitCssError !== null) errors['emitCss'] = emitCssError;
  if (snapshotWireError !== null) errors['snapshotWire'] = snapshotWireError;

  const baseline: Baseline = {
    fixtureVersion: FIXTURE_VERSION,
    node: process.version,
    generatedAt: new Date().toISOString(),
    loadMs: {
      parse: round(parseMs),
      buildCells: round(buildCellsMs),
      probe: round(probeMs),
      variance: round(varianceMs),
      listing: round(listingMs),
      snapshotWire: round(snapshotWireMs),
      emitCss: round(emitCssMs),
      total: round(total),
    },
    resolverApplyCount: {
      atCells: applyCountAtCells,
      atProbe: applyCountAtProbe,
      total: applyCountAtCells + applyCountAtProbe,
    },
    wireBytes,
    cssBytes,
    jointOverrideCount: jointOverrides.length,
    axisCount: normalized.axes.length,
    defaultTokenCount: Object.keys(defaultTokens).length,
    errors,
  };

  writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  logPhase(`baseline written to ${relative(process.cwd(), BASELINE_PATH)}`);
  logPhase(`total ${total.toFixed(2)}ms`);
}

function round(ms: number): number {
  return Math.round(ms * 100) / 100;
}

main().catch((err) => {
  logPhase(`FATAL: ${err instanceof Error ? err.message : String(err)}`);
  if (err instanceof Error && err.stack) logPhase(err.stack);
  process.exitCode = 1;
});
