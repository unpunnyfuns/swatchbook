/**
 * Performance regression guard for the joint-block emitter. With the
 * pre-redesign cartesian enumeration, a project with N axes × C contexts
 * each evaluated `Σ_{k=2..N} C(N, k) × C^k` outer iterations — for
 * N=12, C=5, ~243M iterations × ~O(N tokens) of inner work, which
 * hung consumer builds for hours.
 *
 * The per-token variance design (#1027) keeps work bounded by each
 * token's individual `affectedBy` set: a token affected by 2 axes
 * never participates in joint probes involving the project's other
 * axes. This test builds a project where most tokens are baseline-only
 * with a handful affected by a small number of axes, and asserts the
 * emit completes promptly even when the project declares many axes.
 *
 * Loose timing assertion — wall-clock is not deterministic across
 * machines, but 5s is generous and 30m hangs catch the obvious
 * regression of "cartesian enumeration accidentally reintroduced."
 */
import { afterAll, expect, it } from 'vitest';
import { emitAxisProjectedCss } from '#/css-axis-projected.ts';
import { buildTokenGraphFromLayered } from '#/token-graph/build.ts';
import { permutationID } from '#/types.ts';
import type { Axis, Project } from '#/types.ts';
import { extractBlock } from './_helpers.ts';

it('emit completes promptly when the project has 8 axes × 5 contexts each (no cartesian enumeration)', () => {
  const axes: Axis[] = Array.from({ length: 8 }, (_, i) => ({
    name: `axis${i}`,
    contexts: ['default', 'a', 'b', 'c', 'd'],
    default: 'default',
    source: 'layered',
  }));

  const defaultTuple: Record<string, string> = {};
  for (const axis of axes) defaultTuple[axis.name] = axis.default;

  // Baseline: ~10 tokens, only the first one affected by 2 axes.
  const baseline = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      `color.token-${i}`,
      { $type: 'color', $value: '#000000' },
    ]),
  );

  // axis0=a writes color.token-0 → some other value
  // axis1=a writes color.token-0 → yet another value
  // (so token-0 is touched by axis0 and axis1; nothing touched by axis2..7)
  // Keyed via permutationID (Object.values join) so the singleton lookup in
  // buildTokenGraphFromLayered actually finds these — otherwise the writes
  // never register and the test degrades to timing a baseline-only emit.
  const perSingletonResolved: Record<string, Record<string, { $type: string; $value: string }>> = {
    [permutationID({ ...defaultTuple, axis0: 'a' })]: {
      ...baseline,
      'color.token-0': { $type: 'color', $value: '#111111' },
    },
    [permutationID({ ...defaultTuple, axis1: 'a' })]: {
      ...baseline,
      'color.token-0': { $type: 'color', $value: '#222222' },
    },
  };

  const { graph } = buildTokenGraphFromLayered(
    axes,
    baseline,
    perSingletonResolved,
    defaultTuple,
  );

  const project: Project = {
    config: { cssVarPrefix: 'sb' },
    axes,
    disabledAxes: [],
    presets: [],
    chrome: {},
    defaultTokens: baseline,
    defaultTuple,
    resolveAt: () => ({}),
    tokenGraph: graph,
    sourceFiles: [],
    cwd: '',
    listing: {},
    diagnostics: [],
  };

  const t0 = performance.now();
  const css = emitAxisProjectedCss(project);
  const elapsedMs = performance.now() - t0;

  // Sanity: emission produced output.
  expect(css.length).toBeGreaterThan(0);

  // Performance guard: 8 axes × 5 contexts cartesian would be
  // ~Σ C(8,k)×4^k ≈ 390K outer iterations × per-iteration work — even
  // that bounded form is unacceptable when scaled to 12+ axes.
  // Per-token variance with one token touching 2 axes does O(1) probes
  // total. Generous 5s wall-clock budget.
  expect(elapsedMs).toBeLessThan(5000);
});

it('routes per-token variance correctly at scale — touched tokens land in their axis cells, constants stay in :root', () => {
  // Correctness counterpart to the timing guard above. Five axes; only
  // color.token-0 is touched, by two independent single-axis writes
  // (axis0=a and axis1=a). tokens 1..4 are baseline-only. Per-token variance
  // must route token-0 into exactly the axis0 and axis1 cells, emit no cell
  // for the untouched axes, and keep constants in :root — a cartesian
  // regression would spray cells for axes nothing is affected by.
  const axes: Axis[] = Array.from({ length: 5 }, (_, i) => ({
    name: `axis${i}`,
    contexts: ['default', 'a'],
    default: 'default',
    source: 'layered',
  }));

  const defaultTuple: Record<string, string> = {};
  for (const axis of axes) defaultTuple[axis.name] = axis.default;

  const baseline = Object.fromEntries(
    Array.from({ length: 5 }, (_, i) => [
      `color.token-${i}`,
      { $type: 'color', $value: '#000000' },
    ]),
  );

  const perSingletonResolved: Record<string, Record<string, { $type: string; $value: string }>> = {
    [permutationID({ ...defaultTuple, axis0: 'a' })]: {
      ...baseline,
      'color.token-0': { $type: 'color', $value: '#111111' },
    },
    [permutationID({ ...defaultTuple, axis1: 'a' })]: {
      ...baseline,
      'color.token-0': { $type: 'color', $value: '#222222' },
    },
  };

  const { graph } = buildTokenGraphFromLayered(axes, baseline, perSingletonResolved, defaultTuple);

  const project: Project = {
    config: { cssVarPrefix: 'sb' },
    axes,
    disabledAxes: [],
    presets: [],
    chrome: {},
    defaultTokens: baseline,
    defaultTuple,
    resolveAt: () => ({}),
    tokenGraph: graph,
    sourceFiles: [],
    cwd: '',
    listing: {},
    diagnostics: [],
  };

  const css = emitAxisProjectedCss(project);

  // The touched token lands in exactly the two axis cells that write it.
  expect(extractBlock(css, '[data-sb-axis0="a"]')).toMatch(/--sb-color-token-0:/);
  expect(extractBlock(css, '[data-sb-axis1="a"]')).toMatch(/--sb-color-token-0:/);

  // Untouched axes emit no cell at all — variance routing, not cartesian.
  for (const i of [2, 3, 4]) {
    expect(css).not.toContain(`[data-sb-axis${i}="a"]`);
  }

  // Baseline-only tokens live in :root and never leak into a cell.
  expect(extractBlock(css, ':root')).toMatch(/--sb-color-token-3:/);
  const cells = css.split('\n\n').filter((b) => b.startsWith('[data-sb-'));
  for (const cell of cells) {
    expect(cell).not.toMatch(/--sb-color-token-3:/);
  }
});

afterAll(() => {
  // No teardown needed; the project is local to the test.
});
