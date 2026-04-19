---
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-core': patch
---

Unify block chrome: text colors, surface backgrounds, and border weights now come from named constants in `internal/styles` (`TEXT_MUTED`, `TEXT_DEFAULT`, `SURFACE_DEFAULT`, `SURFACE_MUTED`, `SURFACE_RAISED`, `BORDER_DEFAULT`, `BORDER_STRONG`, `BORDER_FAINT`) instead of inline `var(--sb-*)` strings repeated across 15+ files. Empty-state divs are replaced by a shared `EmptyState` component. No visual change for valid configs; fallback alphas now match across blocks.
