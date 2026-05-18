---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-integrations': patch
---

Enable a small batch of correctness-leaning oxlint rules — the ones without safe autofix that nudge style consistency rather than mechanical reshape.

- `no-throw-literal` — throw `Error` (or subclass), not strings. Better stack traces; matches established codebase pattern.
- `typescript/no-inferrable-types` — strip redundant annotations like `let x: string = 'foo'`. Lets TS do its job.
- `typescript/consistent-type-definitions: ["error", "interface"]` — pick `interface` for object shapes; `type` stays valid for unions / intersections / primitives.

Codebase was nearly compliant — only two pre-existing violations across the monorepo. Fixed both in the same PR.
