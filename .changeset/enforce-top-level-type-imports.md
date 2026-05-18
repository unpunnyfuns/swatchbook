---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

Enable `import/consistent-type-specifier-style: ["error", "prefer-top-level"]` in `.oxlintrc.json` so mixed-syntax type imports (`import { type X, value }`) are caught at lint time and autofixed to the pure top-level form (`import type { X }` / `import { value }`). Sweep over the existing codebase via `oxlint --fix`.

Mixed-syntax type imports erase the type binding under tsc, but the bundler still sees a side-effect import — esbuild in particular can drag the entire upstream bundle just because the import statement exists. Pure top-level form is fully erased.
