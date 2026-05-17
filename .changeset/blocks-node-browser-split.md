---
"@unpunnyfuns/swatchbook-blocks": patch
---

Third (and final) sub-PR for #818. Splits `packages/blocks`'s vitest config into two projects, matching the shape `packages/addon/vitest.config.ts` already uses:

- **node** — pure-function tests (`*.test.ts`): `format-color`, `format-token-value`, `sort-tokens`. Run in Node, no browser harness, ~40× faster (157 ms vs ~6 s under the browser provider).
- **browser** — component tests (`*.test.tsx`): everything that calls `render(<X />)`. Runs in real Chromium + Firefox.

The `.ts` vs `.tsx` discriminator is load-bearing and already consistent across this package: every `.test.tsx` file renders a React component, every `.test.ts` is pure-function. No file renames needed.

Closes the #818 trilogy; with sub-PRs 1 (switcher migration #873) and 2 (fireEvent → userEvent sweep #875) already merged, the test infrastructure alignment work from the audit's "Critical" tier is done.
