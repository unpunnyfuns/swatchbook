/**
 * Axis-projection emitter (`emitAxisProjectedCss`) — a size-optimization
 * alternative to the cartesian `emitCss` / `projectCss` path, valid
 * only for resolver projects whose modifiers are orthogonal. Tests pin:
 *
 *   - the structural shape (one `:root` baseline + one single-attribute
 *     cell selector per non-default `(axis, context)`),
 *   - the delta optimization (cells only emit declarations that differ
 *     from the baseline value at the same var name),
 *   - the size win vs. cartesian emission for the same project, and
 *   - the joint-variance lossiness — when a fixture authors non-orthogonal
 *     modifiers (which the DTCG resolver spec explicitly permits, per
 *     the Primer "Pirate" light-only example in the rationale doc), this
 *     emitter silently produces the projection-implied value rather than
 *     the spec-correct joint resolution. Cartesian (`emitCss`) is the
 *     spec-faithful default; this emitter is opt-in for orthogonal cases.
 *     The joint-variance test below pins the lossy behavior so future
 *     changes don't quietly "fix" it without an explicit decision —
 *     the planned smart emitter (analysis + per-token routing) is the
 *     intended fix path.
 */
import { beforeAll, expect, it } from 'vitest';
import { emitAxisProjectedCss } from '#/css-axis-projected';
import { projectCss } from '#/emit';
import type { Project } from '#/types';
import { extractBlock, loadWithPrefix } from './_helpers';

let project: Project;

// beforeAll: loadProject takes ~1s; every test reads from the same project.
beforeAll(async () => {
  project = await loadWithPrefix('sb');
}, 30_000);

it('emits one :root baseline block plus N cell blocks (Σ axes × non-default contexts), plus the trailing chrome block', () => {
  const css = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
    chrome: project.chrome,
  });
  // Two `:root {` openings — baseline + chrome trailer.
  const rootMatches = css.match(/(^|\n):root\s*\{/g) ?? [];
  expect(rootMatches).toHaveLength(2);
  // The fixture has three axes with one non-default context each
  // (Dark, Brand A, High) → three cell blocks.
  const expectedCells = project.axes.reduce((n, a) => n + (a.contexts.length - 1), 0);
  const cellMatches = css.match(/\n\[data-sb-[^\]]+\]\s*\{/g) ?? [];
  expect(cellMatches).toHaveLength(expectedCells);
});

it('uses single-attribute selectors only — no compound [data-…][data-…] selectors anywhere', () => {
  const css = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
  });
  expect(css).not.toMatch(/\[data-[^\]]+\]\[data-/);
});

it('emits per-axis cell selectors that match each non-default context', () => {
  const css = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
  });
  for (const axis of project.axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      expect(css).toContain(`[data-sb-${axis.name}="${ctx}"]`);
    }
  }
});

it("cell blocks carry only deltas — tokens unchanged from baseline don't appear in the cell", () => {
  const css = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
  });
  // The baseline declares the full token graph. Each cell should be a
  // small fraction of that — mode-invariant primitives (palette, size,
  // typography) belong in :root and stay out of the Dark cell.
  const baseline = extractBlock(css, ':root');
  const darkCell = extractBlock(css, '[data-sb-mode="Dark"]');
  expect(baseline).toBeTruthy();
  expect(darkCell).toBeTruthy();
  const baselineVarCount = (baseline.match(/--sb-/g) ?? []).length;
  const darkCellVarCount = (darkCell.match(/--sb-/g) ?? []).length;
  expect(darkCellVarCount).toBeLessThan(baselineVarCount / 2);
});

it("mode-invariant tokens (size scale primitives) don't appear in the mode cell", () => {
  const css = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
  });
  const darkCell = extractBlock(css, '[data-sb-mode="Dark"]');
  expect(darkCell).not.toMatch(/--sb-size-400:/);
  expect(darkCell).not.toMatch(/--sb-font-family-sans:/);
});

it('produces a stylesheet meaningfully smaller than the cartesian emission for the same project', () => {
  const projected = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
    chrome: project.chrome,
  });
  const cartesian = projectCss(project);
  // 8 cartesian tuples × full-token redeclaration vs baseline + 3 deltas
  // → projected must be substantially smaller. Tightened past the
  // half-size threshold to a third — large headroom for fixture growth
  // while still catching regressions.
  expect(projected.length).toBeLessThan(cartesian.length / 3);
});

it('terminates with a trailing newline + emits chrome aliases identically to emitCss', () => {
  const css = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
    chrome: project.chrome,
  });
  expect(css.endsWith('\n')).toBe(true);
  // The chrome aliases block is appended at the tail — same shape as
  // emitCss writes — so blocks that read `--swatchbook-*` resolve the
  // same way regardless of which emitter ran.
  expect(css).toContain('color-scheme: light dark;');
  expect(css).toContain('--swatchbook-surface-default:');
});

it("joint-variance lossiness: a cell's declaration drops out when its value equals baseline, even if another cell overrides the same token — under runtime cascade, the other cell's value wins at the joint tuple instead of this cell's intent. Documents projection's lossiness for spec-compliant non-orthogonal fixtures (consumers wanting joint-variance correctness should use cartesian `emitCss`, or wait for the planned smart emitter).", () => {
  const css = emitAxisProjectedCss(project.permutations, project.permutationsResolved, {
    axes: project.axes,
    prefix: project.config.cssVarPrefix ?? '',
  });
  // Pick a token whose Brand A cell happens to equal baseline. The
  // fixture's `color.accent.fg` is `neutral.0` (white) in both
  // baseline (Light + Default) and the Brand A cell, but Dark mode
  // overrides it to a dark value. Under projection, the Brand A cell
  // does NOT re-emit `color.accent.fg` (delta-vs-baseline is zero),
  // so at runtime `<html data-sb-mode="Dark" data-sb-brand="Brand A">`
  // resolves `accent.fg` to Dark's dark value — even though the
  // cartesian-emitted joint tuple (per `resolutionOrder` last-wins)
  // would have produced white. This is what the DTCG spec calls
  // out: non-orthogonal modifiers are allowed (Primer's "Pirate"
  // light-only theme is the rationale doc's canonical example), and
  // tools that take liberties with the emit strategy can lose joint
  // resolution. Cartesian `emitCss` is the spec-faithful default.
  const brandACell = extractBlock(css, '[data-sb-brand="Brand A"]');
  const darkCell = extractBlock(css, '[data-sb-mode="Dark"]');
  expect(brandACell).toBeTruthy();
  expect(darkCell).toBeTruthy();
  // Brand A cell does NOT mention accent-fg (it equals baseline).
  expect(brandACell).not.toMatch(/--sb-color-accent-fg:/);
  // Dark cell DOES override accent-fg.
  expect(darkCell).toMatch(/--sb-color-accent-fg:/);
});
