---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-switcher": patch
---

Closes #896. Four contained test-hygiene items bundled into one PR:

**Switcher `.browser.test.tsx` infix** (#896 #14) — `packages/switcher/test/theme-switcher.test.tsx` → `theme-switcher.browser.test.tsx`. Matches the convention established by #877 (`.browser.` opt-in for tests requiring the browser harness). Switcher's `include: ['test/**/*.test.{ts,tsx}']` glob continues to match.

**`diagnostics.test.ts` split** (#896 #15) — `packages/core/test/diagnostics.test.ts` had two top-level `describe` blocks (`BufferedLogger` + `toDiagnostics`), a hard "one describe per file" rule violation #879's split sweep missed. Now: `diagnostics-buffered-logger.test.ts` + `diagnostics-to-diagnostics.test.ts`.

**Cosmetic describes dropped** from addon tests:
- `packages/addon/test/preset.test.ts` — `describe('renderTokenTypes', …)` wrapper removed
- `packages/addon/test/virtual-plugin.test.ts` — `describe('collectWatchPaths', …)` wrapper removed
- `packages/addon/test/integration-side-effects.test.ts` — `describe('integration-side-effects aggregate virtual module', …)` wrapper removed

Each file already conveys the subject; the wrapping describe added nothing.

**Ghost-field test fixtures cleaned** (#896 #19):
- `packages/addon/test/preset.test.ts` — `fakeProject()` stub dropped `permutations: []`, `permutationsResolved: {}`, `graph: {}` (removed from `Project` shape post-cartesian-drop; tests pass because callers don't read these, but the fakes were bit-rotted documentation). Added the real fields the stub was missing (`defaultTokens`, `cwd`, `chrome`).
- `packages/addon/test/virtual-plugin.test.ts` — same fields dropped from local `project()` helper.
- `packages/addon/test/virtual-stub.ts` — `permutations`, `defaultPermutation`, `permutationsResolved` exports dropped; the `cells` object now declares its tokens inline rather than indirecting through the removed `permutationsResolved`.

**Clean-config smoke test** (#896 #18) — new `packages/core/test/clean-config-smoke.test.ts` pins the meta-invariant that loading the reference fixture with no edge-case config produces zero diagnostics. Every diagnostic group has positive-fire coverage elsewhere; nothing was asserting the silence on the happy path. Catches the case where an upstream Terrazzo bump starts spitting warns / info without anyone noticing.
