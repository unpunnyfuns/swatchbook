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
import { expect, it } from 'vitest';
import { loadWithPrefix } from './_helpers.ts';

it('reference fixture loads with zero diagnostics on a clean config', async () => {
  const project = await loadWithPrefix('sb');
  expect(project.diagnostics).toEqual([]);
}, 30_000);
