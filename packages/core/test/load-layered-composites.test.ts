/**
 * Layered-fixture coverage for composites + multi-hop alias chains.
 *
 * The layered fixture grew (#833) to include `shadow.md`, `border.default`,
 * `transition.enter`, `typography.heading` and a multi-hop `color.fg →
 * color.text → color.black/white` chain so that the layered loader path
 * has real-data coverage for the same composite + alias-chain shapes the
 * resolver-path reference fixture exercises.
 *
 * Without this, the layered loader has only color-token + single-hop alias
 * coverage — a real consumer using layered mode with composites would be
 * the first to discover any bug in alias-through-composite resolution
 * under the layered path.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { beforeAll, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Config, Project } from '#/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureCwd = resolve(here, 'fixtures/layered');

let project: Project;
beforeAll(async () => {
  const config: Config = {
    tokens: ['base/*.json'],
    axes: [
      { name: 'mode', contexts: { Light: [], Dark: ['modes/dark.json'] }, default: 'Light' },
      {
        name: 'brand',
        contexts: { Default: [], 'Brand A': ['brands/brand-a.json'] },
        default: 'Default',
      },
    ],
  };
  project = await loadProject(config, fixtureCwd);
}, 30_000);

it('composite tokens (shadow, border, transition, typography) load with sub-field aliases intact', () => {
  // shadow.md.color aliases color.black; offsetY/blur alias dimension.xs/sm.
  // border.default.color aliases color.accent (which itself aliases color.blue).
  // transition.enter.duration aliases duration.fast; timingFunction aliases cubicBezier.ease-out.
  // typography.heading.fontFamily / fontWeight alias the matching primitives.
  expect(project.defaultTokens['shadow.md']?.$type).toBe('shadow');
  expect(project.defaultTokens['border.default']?.$type).toBe('border');
  expect(project.defaultTokens['transition.enter']?.$type).toBe('transition');
  expect(project.defaultTokens['typography.heading']?.$type).toBe('typography');
});

it('multi-hop alias chain resolves transitively (color.fg → color.text → color.black) in Light mode', () => {
  const light = project.resolveAt({ mode: 'Light', brand: 'Default' });
  // Two hops to a primitive — exercises the layered loader's alias
  // re-resolution through one indirection level on top of the direct
  // alias the single-hop tests already cover.
  expect(light['color.fg']?.$value).toMatchObject({ components: [0, 0, 0] });
});

it('multi-hop alias chain re-resolves when the intermediate target flips under an axis (Dark overrides color.text → white)', () => {
  const dark = project.resolveAt({ mode: 'Dark', brand: 'Default' });
  // color.fg still aliases color.text; color.text is overridden to white
  // in Dark mode; so color.fg resolves to white. The layered loader
  // must re-resolve the chain at the Dark tuple, not freeze it against
  // the baseline.
  expect(dark['color.fg']?.$value).toMatchObject({ components: [1, 1, 1] });
});

it('composite sub-field flips when its alias target is re-aimed under an axis (shadow.md.color in Dark)', () => {
  // In Light, shadow.md.color aliases color.black. In Dark, dark.json
  // re-aims shadow.md.color to {color.white}. The layered loader has
  // to apply the composite-token override as a whole; this assertion
  // checks the resolved composite value reflects the Dark-mode alias.
  // Terrazzo normalizes shadow `$value` to an array of layers regardless
  // of authored shape, so single-layer shadows still expose `[0].color`.
  const dark = project.resolveAt({ mode: 'Dark', brand: 'Default' });
  const layers = dark['shadow.md']?.$value as
    | ReadonlyArray<{ color?: { components?: number[] } }>
    | undefined;
  expect(layers?.[0]?.color?.components).toEqual([1, 1, 1]);
});

it('composite alias chain depth ≥ 2 resolves through the layered loader (border.default.color → color.accent → color.blue)', () => {
  // border.default.color aliases color.accent, which itself aliases
  // color.blue. Light + Default — no brand override on accent.
  const light = project.resolveAt({ mode: 'Light', brand: 'Default' });
  const border = light['border.default']?.$value as
    | { color?: { components?: number[] } }
    | undefined;
  expect(border?.color?.components).toEqual([0.1, 0.3, 0.9]);
});

it('composite alias chain re-resolves when the chain head is re-aimed under an axis (border.default.color in Brand A)', () => {
  // Brand A overrides color.accent → color.red. border.default.color
  // still aliases color.accent, so it should now resolve to red.
  const brand = project.resolveAt({ mode: 'Light', brand: 'Brand A' });
  const border = brand['border.default']?.$value as
    | { color?: { components?: number[] } }
    | undefined;
  expect(border?.color?.components).toEqual([0.9, 0.2, 0.2]);
});
