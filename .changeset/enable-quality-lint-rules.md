---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Enable a batch of oxlint quality rules and sweep the existing codebase via autofix.

Direct enforcement of project conventions (`CLAUDE.md`):
- `no-inline-comments` — "No inline end-of-line comments."
- `import/extensions` (with `ignorePackages`) — "Import specifiers: explicit extensions, always" for relative + `#/` imports; npm package imports stay extensionless.

Style + correctness (all autofixable, applied via `oxlint --fix`):
- `eqeqeq` (with `smart` so `== null` stays as the "null-or-undefined" idiom)
- `no-var`, `prefer-const`, `object-shorthand`, `no-else-return`
- `react/self-closing-comp`, `react/jsx-boolean-value`, `react/jsx-fragments`
- `typescript/array-type`
- `unicorn/throw-new-error`, `unicorn/catch-error-name`, `unicorn/prefer-includes`

CI catches future regressions; new contributors don't need to memorise the conventions.
