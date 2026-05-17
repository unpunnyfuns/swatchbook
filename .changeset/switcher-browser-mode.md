---
"@unpunnyfuns/swatchbook-switcher": patch
---

First of three sub-PRs for #818. Migrates the switcher test suite from jsdom to vitest's real-browser mode (Chromium + Firefox via `@vitest/browser-playwright`) — the same shape `packages/blocks` and `packages/addon` already use. Project convention bans jsdom (its partial keyboard/focus/pointer simulation is the kind of thing that hides real regressions); the switcher was the last holdout.

Drops `jsdom@^29.0.2` from dev deps; adds `@vitest/browser@^4.1.4`, `@vitest/browser-playwright@^4.1.4`, `playwright@^1.59.1`. The `react()` plugin keeps `jsxRuntime: 'classic'` so tests still exercise the manager-bundle-compatible JSX output the switcher ships.

In the test file: `fireEvent.click` → `userEvent.click` from `@vitest/browser/context` (project convention for browser-mode tests). Two click handlers gain `async/await` since `userEvent.click` returns a Promise. Removed the wrapping `describe('ThemeSwitcher', …)` block since the project convention is one-describe-per-file at most, and the file's name already carries that grouping.

CI no-op: the existing Playwright-image-based job already covers any package that uses the browser provider; no workflow edits needed. `fireEvent → userEvent` in `packages/blocks/test/` and the `apps/storybook` browser-mode harness changes are tracked as separate sub-PRs of #818.
