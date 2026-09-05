/**
 * Meta-invariant: loading the reference fixture with no edge-case config
 * (no `disabledAxes`, no invalid `chrome` targets, no deprecated
 * `cssOptions` knobs, no malformed `presets`) produces zero diagnostics.
 *
 * Every diagnostic group has its own positive-fire coverage elsewhere
 * (`load-validation.test.ts`, `disabled-axes.test.ts`, `chrome.test.ts`,
 * `token-listing.test.ts`, `default-tuple.test.ts`, `permutations-
 * normalize-gating.test.ts`, `resolver-edge-cases.test.ts`); what's
 * tested here is the silence on the happy path. Catches the case where
 * an upstream Terrazzo bump starts spitting warns or info entries that
 * weren't there before — without this assertion, that drift could ship
 * unnoticed until a consumer files a noise complaint.
 */
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { dirname } from 'node:path';
import { expect, it } from 'vitest';
import { loadProject } from '#/load.ts';

it('reference fixture loads with zero diagnostics on a clean config', async () => {
  const project = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
      cssVarPrefix: 'sb',
      // Terrazzo's recommended `core/consistent-naming` wants kebab-case, which
      // the DTCG `$type` roots it also recommends organising by cannot satisfy:
      // `cubicBezier`, `fontFamily`, `fontWeight` and `strokeStyle` are camelCase
      // in the spec. The fixture follows the $type organisation, so the rule is
      // off here rather than renaming tokens away from the spec.
      lintOptions: { rules: { 'core/consistent-naming': 'off' } },
    },
    dirname(tokensDir),
  );
  expect(project.diagnostics).toEqual([]);
}, 30_000);
