---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-blocks": patch
---

Closes #858. Splits four test files that carried 2–4 top-level `describe` blocks into one-file-per-describe, per project convention ("one describe per file at most"):

- `packages/core/test/permutations-normalize.test.ts` → `permutations-normalize-gating.test.ts` + `permutations-normalize-dispatch.test.ts`. Disjoint setup; gating tests don't need the workspace-tmpdir lifecycle the dispatch tests use.
- `packages/core/test/variance-analysis.test.ts` → `variance-analysis-reference.test.ts` + `variance-analysis-layered.test.ts` + `variance-analysis-edge-cases.test.ts`. Each new file owns its own `beforeAll` for the project it loads — the reference fixture, the layered fixture, or none.
- `packages/blocks/test/detail-overlay.browser.test.tsx` → `-focus-lifecycle`, `-focus-trap`, `-dismissal` splits + shared `_detail-overlay-helpers.tsx` for `emptySnapshot()` / `renderOverlay()`.
- `packages/blocks/test/token-navigator-keyboard.browser.test.tsx` → `-roving-tabindex`, `-arrow-navigation`, `-expand-collapse`, `-activation` splits + shared `_token-navigator-keyboard-helpers.tsx` for `snapshot()` / `renderNav()` / `treeItem()`.

Helpers use the existing leading-underscore convention (matching `_color-table-helpers.tsx`, `_helpers.ts`). No assertion changes; same tests, same shapes, just reachable as flat `it()` calls in each file's reporter output.
