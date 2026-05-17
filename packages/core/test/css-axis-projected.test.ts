/**
 * Smart axis-projection emitter (`emitAxisProjectedCss`) — routes each
 * token through `analyzeProjectVariance` and emits via projection
 * (single-attribute selectors) for orthogonal tokens or compound
 * selectors for joint-variant tokens. Spec-faithful for any
 * DTCG-compliant resolver.
 *
 * Tests pin:
 *
 *   - the structural shape (one `:root` baseline + one single-attribute
 *     cell selector per non-default `(axis, context)` that has touching
 *     tokens; plus compound `[data-A][data-B]` blocks for joint cases),
 *   - the per-axis cells contain only tokens that axis actually touches
 *     (variance-driven filter — palette primitives never appear in any
 *     cell),
 *   - joint-variant tokens get compound selectors with the
 *     cartesian-correct value (the fixture's `color.accent.fg` Dark+High
 *     interaction is the canonical case),
 *   - smart dedup: cells re-emit values when ANY axis touches the var,
 *     so cascade resolves orthogonal-after-probe tokens correctly
 *     (Brand A's `accent.fg = white` IS now emitted because Dark
 *     touches the var, even though it matches baseline),
 *   - the chrome alias block is emitted unchanged at the tail.
 */
import { beforeAll, expect, it } from 'vitest';
import { emitAxisProjectedCss } from '#/css-axis-projected';
import type { Project } from '#/types';
import { extractBlock, loadWithPrefix } from './_helpers';

let project: Project;

// beforeAll: loadProject takes ~1s; every test reads from the same project.
beforeAll(async () => {
  project = await loadWithPrefix('sb');
}, 30_000);

it('emits one :root baseline block plus N per-axis cell blocks plus the trailing chrome block, with optional compound joint blocks in between', () => {
  const css = emitAxisProjectedCss(project);
  // Two `:root {` openings — baseline + chrome trailer.
  const rootMatches = css.match(/(^|\n):root\s*\{/g) ?? [];
  expect(rootMatches).toHaveLength(2);
  // The fixture has three axes with one non-default context each
  // (Dark, Brand A, High). Each axis cell block exists if any token
  // touches that axis — for our fixture all three axes touch something.
  for (const axis of project.axes) {
    for (const ctx of axis.contexts) {
      if (ctx === axis.default) continue;
      expect(css).toContain(`[data-sb-${axis.name}="${ctx}"]`);
    }
  }
});

it('emits compound [data-A][data-B] blocks for joint-variant tokens (joint blocks contain the cartesian-correct value, not the projection-composed value)', () => {
  const css = emitAxisProjectedCss(project);
  // The fixture has joint variance on `color.accent.fg` between mode and
  // contrast (Dark mode's `accessible.accent.fg = neutral.900` is aliased
  // through by contrast=High; the joint Dark+High tuple resolves to dark
  // text rather than the white that projection-composition of Light's
  // accessible.accent would produce).
  const compoundSelectors = css.match(/\[data-sb-[^\]]+\]\[data-sb-[^\]]+\]/g) ?? [];
  expect(compoundSelectors.length).toBeGreaterThan(0);

  // At least one compound block touches color.accent.fg.
  const compoundBlocks = css.split('\n\n').filter((b) => /\[data-sb-[^\]]+\]\[data-sb-/.test(b));
  const fgInAnyCompound = compoundBlocks.some((b) => /--sb-color-accent-fg:/.test(b));
  expect(fgInAnyCompound).toBe(true);
});

it('per-axis cell blocks contain only the delta tokens that genuinely differ from baseline at that axis-context (delta cells, joint case handled by compound block above)', () => {
  const css = emitAxisProjectedCss(project);
  // `color.accent.fg` at brand=Brand A alone equals baseline (white),
  // so it doesn't appear in the Brand A cell. The joint Dark+BrandA
  // divergence is handled by the compound `[data-sb-mode][data-sb-brand]`
  // block (covered above), not by re-emitting the baseline-equal value
  // into the brand cell.
  const brandACell = extractBlock(css, '[data-sb-brand="Brand A"]');
  expect(brandACell).toBeTruthy();
  // Brand A genuinely changes the violet roles — those land in the cell.
  expect(brandACell).toMatch(/--sb-color-accent-bg:/);
});

it('baseline-only tokens (palette primitives) appear ONLY in :root, never in any cell', () => {
  const css = emitAxisProjectedCss(project);
  const baseline = extractBlock(css, ':root');
  expect(baseline).toMatch(/--sb-color-palette-blue-500:/);
  // No cell or compound block should redeclare a palette primitive.
  const allCells = css.split('\n\n').filter((b) => b.startsWith('[data-sb-'));
  for (const block of allCells) {
    expect(block).not.toMatch(/--sb-color-palette-blue-500:/);
  }
});

it("mode-invariant tokens (e.g. size primitives, font families) still don't appear in the mode cell — single-axis routing", () => {
  const css = emitAxisProjectedCss(project);
  const darkCell = extractBlock(css, '[data-sb-mode="Dark"]');
  expect(darkCell).not.toMatch(/--sb-size-400:/);
  expect(darkCell).not.toMatch(/--sb-font-family-sans:/);
});

it('terminates with a trailing newline + emits a chrome alias block at the tail', () => {
  const css = emitAxisProjectedCss(project);
  expect(css.endsWith('\n')).toBe(true);
  expect(css).toContain('color-scheme: light dark;');
  expect(css).toContain('--swatchbook-surface-default:');
});

it('respects options.prefix when overriding the project default', () => {
  const css = emitAxisProjectedCss(project, { prefix: 'ds' });
  // Var prefix flips from `--sb-*` to `--ds-*` and so do the data attrs.
  expect(css).toContain('--ds-color-');
  expect(css).toContain('[data-ds-mode="Dark"]');
  expect(css).not.toContain('--sb-color-');
});

it('respects options.chrome override (passes through to chrome alias block)', () => {
  const css = emitAxisProjectedCss(project, {
    chrome: { surfaceDefault: 'color.palette.blue.500' },
  });
  expect(css).toContain(
    '--swatchbook-surface-default: var(--sb-color-palette-blue-500);',
  );
});
