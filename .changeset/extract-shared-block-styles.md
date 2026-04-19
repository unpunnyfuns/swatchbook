---
'@unpunnyfuns/swatchbook-blocks': patch
---

Extract the `wrapper` / `caption` / `empty` inline styles (plus the monospace stack and default border strings) shared across block components into `#/internal/styles.ts`. Pure refactor — no visible rendering change; each block's remaining `const styles = { ... }` now references the shared constants instead of re-declaring them.
