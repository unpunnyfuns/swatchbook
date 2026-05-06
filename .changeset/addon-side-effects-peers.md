---
"@unpunnyfuns/swatchbook-addon": patch
---

Build: `sideEffects` now lists `./dist/preview.mjs` instead of `false`. The previous declaration was technically wrong — `preview.tsx` does `import 'virtual:swatchbook/integration-side-effects'` purely for its effects. Bundlers honoring `sideEffects: false` could elide the import; in practice Storybook loads the preview entry whole, so this is a correctness tightening rather than a behavior change.

Promote `@storybook/react-vite` and `vite` from `devDependencies` to `peerDependencies` (alongside the existing `react`, `react-dom`, `storybook` peers). Both are imported as types from the addon's source (`Decorator` / `Preview` from `@storybook/react-vite`, `InlineConfig` from `vite`), so consumer typecheck depends on them being resolvable. Previously they were carried transitively via `storybook`; declaring them explicitly makes the dependency contract honest.
