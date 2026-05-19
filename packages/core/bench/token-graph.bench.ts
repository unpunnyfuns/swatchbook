import { bench, describe } from 'vitest';
import { buildTokenGraph } from '#/token-graph/build.ts';
import { resolveAllAt, resolveAt } from '#/token-graph/walk.ts';
import { getVariance } from '#/token-graph/queries.ts';
import type { TokenGraph } from '#/token-graph/types.ts';
import { loadReferenceFixtureParserInput } from '../test/_helpers.ts';

// ─── Shared setup ─────────────────────────────────────────────────────────────
//
// vitest's bench mode does not run beforeAll hooks — the runner lifecycle
// for benchmarks is handled by tinybench, not the test runner. Set up shared
// state via a top-level Promise that resolves once; each bench that needs the
// graph awaits it on first call (lazy, not re-executed per iteration).

interface GraphFixture {
  graph: TokenGraph;
  defaultTuple: Record<string, string>;
  constantPath: string;
  varyingPath: string;
  multiAxisPath: string;
  modeCtx1: string;
  brandCtx1: string;
}

const graphFixturePromise: Promise<GraphFixture> = loadReferenceFixtureParserInput().then((fx) => {
  const { graph } = buildTokenGraph(fx.parserInput, fx.axes, fx.defaultTuple);
  const { defaultTuple } = fx;
  const paths = Object.keys(graph.nodes);
  const constantPath = paths.find((p) => graph.nodes[p]!.affectedBy.length === 0) ?? paths[0] ?? '';
  const varyingPath = paths.find((p) => graph.nodes[p]!.affectedBy.length >= 1) ?? paths[0] ?? '';
  const multiAxisPath =
    paths.find((p) => (graph.nodes[p]?.affectedBy.length ?? 0) > 1) ?? varyingPath;
  const modeCtx1 = graph.axisContexts['mode']?.[1] ?? defaultTuple['mode'] ?? '';
  const brandCtx1 = graph.axisContexts['brand']?.[1] ?? defaultTuple['brand'] ?? '';
  return { graph, defaultTuple, constantPath, varyingPath, multiAxisPath, modeCtx1, brandCtx1 };
});

// ─── buildTokenGraph ──────────────────────────────────────────────────────────
//
// Each iteration re-loads the fixture (normalizePermutations + buildTokenGraph)
// to measure the combined parse + build cost — representative of cold
// loadProject startup on the reference workload.

describe('buildTokenGraph', () => {
  bench('reference fixture — full build', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    buildTokenGraph(parserInput, axes, defaultTuple);
  });
});

// ─── resolveAt ────────────────────────────────────────────────────────────────
//
// Graph is built once (module-level promise); each iteration calls resolveAt.
// Variants exercise the three fast-path branches:
//   constant → affectedBy.length === 0 (single lookup, no write scan)
//   varying/default → affectedBy has entries but tuple is default (early exit)
//   single-axis non-default → one axis write lookup
//   joint tuple → two axes, exercises multi-axis write ordering

describe('resolveAt — reference fixture', () => {
  bench('constant path / default tuple', async () => {
    const { graph, constantPath, defaultTuple } = await graphFixturePromise;
    resolveAt(graph, constantPath, defaultTuple);
  });

  bench('varying path / default tuple', async () => {
    const { graph, varyingPath, defaultTuple } = await graphFixturePromise;
    resolveAt(graph, varyingPath, defaultTuple);
  });

  bench('varying path / single-axis non-default (mode)', async () => {
    const { graph, varyingPath, defaultTuple, modeCtx1 } = await graphFixturePromise;
    resolveAt(graph, varyingPath, { ...defaultTuple, mode: modeCtx1 });
  });

  bench('varying path / joint tuple (mode + brand)', async () => {
    const { graph, varyingPath, defaultTuple, modeCtx1, brandCtx1 } = await graphFixturePromise;
    resolveAt(graph, varyingPath, { ...defaultTuple, mode: modeCtx1, brand: brandCtx1 });
  });
});

// ─── resolveAllAt ─────────────────────────────────────────────────────────────

describe('resolveAllAt — reference fixture', () => {
  bench('default tuple', async () => {
    const { graph, defaultTuple } = await graphFixturePromise;
    resolveAllAt(graph, defaultTuple);
  });

  bench('single-axis non-default (mode)', async () => {
    const { graph, defaultTuple, modeCtx1 } = await graphFixturePromise;
    resolveAllAt(graph, { ...defaultTuple, mode: modeCtx1 });
  });
});

// ─── getVariance ──────────────────────────────────────────────────────────────

describe('getVariance — reference fixture', () => {
  bench('constant path', async () => {
    const { graph, constantPath } = await graphFixturePromise;
    getVariance(graph, constantPath);
  });

  bench('multi-axis varying path', async () => {
    const { graph, multiAxisPath } = await graphFixturePromise;
    getVariance(graph, multiAxisPath);
  });
});
