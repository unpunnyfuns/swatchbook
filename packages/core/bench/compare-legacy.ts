/**
 * compare-legacy.ts — one-shot comparison of legacy vs token-graph build on
 * the reference fixture.
 *
 * Run via:
 *   node --experimental-strip-types packages/core/bench/compare-legacy.ts
 * from the repo root (resolves `#/*` via package.json#imports which
 * Node 24+ honours natively).
 *
 * Reports median build time over N_RUNS for each path and their ratio.
 */

import { dirname } from 'node:path';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { BufferedLogger } from '#/diagnostics.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import { resolveDefaultTuple } from '#/permutations/default.ts';
import { buildCells } from '#/cells.ts';
import { probeJointOverrides } from '#/joint-overrides.ts';
import { buildVarianceByPath } from '#/variance-by-path.ts';
import { buildTokenGraph } from '#/token-graph/build.ts';
import type { ParserInput, Axis } from '#/types.ts';

const N_RUNS = 10;
const fixtureCwd = dirname(tokensDir);

function median(times: number[]): number {
  const sorted = times.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

async function loadFixture(): Promise<{
  parserInput: ParserInput;
  axes: readonly Axis[];
  defaultTuple: Record<string, string>;
}> {
  const logger = new BufferedLogger({ level: 'warn' });
  const normalized = await normalizePermutations(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
    },
    fixtureCwd,
    logger,
  );
  if (!normalized.parserInput) {
    throw new Error('reference fixture has no parserInput — resolver did not load');
  }
  const { tuple: defaultTuple } = resolveDefaultTuple(
    { mode: 'Light', brand: 'Default', contrast: 'Normal' },
    normalized.axes,
  );
  return { parserInput: normalized.parserInput, axes: normalized.axes, defaultTuple };
}

async function main(): Promise<void> {
  process.stdout.write(`compare-legacy | node ${process.version} | runs=${N_RUNS}\n`);
  process.stdout.write('loading fixture once for setup…\n');

  const fx = await loadFixture();
  const { parserInput, axes, defaultTuple } = fx;

  // ── Legacy path ─────────────────────────────────────────────────────────────
  // buildCells + probeJointOverrides + buildVarianceByPath
  // These are the three functions that will be deleted in Phase 6.

  process.stdout.write('\nrunning legacy path…\n');
  const legacyTimes: number[] = [];
  for (let i = 0; i < N_RUNS; i++) {
    const t0 = performance.now();
    const resolveTuple = (tuple: Readonly<Record<string, string>>) =>
      parserInput.resolver.apply(tuple as Record<string, string>);
    const cells = buildCells(axes, resolveTuple, defaultTuple);
    const firstAxis = axes[0];
    const baseline = firstAxis ? (cells[firstAxis.name]?.[firstAxis.default] ?? {}) : {};
    probeJointOverrides(axes, cells, defaultTuple, parserInput.resolver);
    buildVarianceByPath(axes, cells, new Map(), baseline);
    legacyTimes.push(performance.now() - t0);
    process.stdout.write(`  run ${i + 1}/${N_RUNS} = ${legacyTimes[i]!.toFixed(3)}ms\n`);
  }
  const legacyMedian = median(legacyTimes);
  process.stdout.write(`  median = ${legacyMedian.toFixed(3)}ms\n`);

  // ── New path ─────────────────────────────────────────────────────────────────
  // buildTokenGraph only

  process.stdout.write('\nrunning new (token-graph) path…\n');
  const newTimes: number[] = [];
  for (let i = 0; i < N_RUNS; i++) {
    const t0 = performance.now();
    buildTokenGraph(parserInput, axes, defaultTuple);
    newTimes.push(performance.now() - t0);
    process.stdout.write(`  run ${i + 1}/${N_RUNS} = ${newTimes[i]!.toFixed(3)}ms\n`);
  }
  const newMedian = median(newTimes);
  process.stdout.write(`  median = ${newMedian.toFixed(3)}ms\n`);

  // ── Summary ──────────────────────────────────────────────────────────────────

  const ratio = legacyMedian / newMedian;
  process.stdout.write('\n');
  process.stdout.write('─'.repeat(60) + '\n');
  process.stdout.write('SUMMARY (reference fixture — synthetic; no real-consumer data)\n');
  process.stdout.write('─'.repeat(60) + '\n');
  process.stdout.write(
    `Legacy (buildCells + probeJointOverrides + buildVarianceByPath): ${legacyMedian.toFixed(3)}ms\n`,
  );
  process.stdout.write(
    `New    (buildTokenGraph):                                         ${newMedian.toFixed(3)}ms\n`,
  );
  process.stdout.write(
    `Ratio  (legacy / new):                                            ${ratio.toFixed(2)}×\n`,
  );
  process.stdout.write('─'.repeat(60) + '\n');
  process.stdout.write('Note: probeJointOverrides includes resolver.apply calls whose\n');
  process.stdout.write("count scales with the fixture's joint-divergence surface, not\n");
  process.stdout.write('the cartesian product size. The 15M-apply workload that prompted\n');
  process.stdout.write('the redesign is not represented here.\n');
}

main().catch((error) => {
  process.stderr.write(String(error) + '\n');
  process.exit(1);
});
