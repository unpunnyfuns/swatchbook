---
'@unpunnyfuns/swatchbook-core': patch
---

Retain Terrazzo's parser output on `Project.parserInput` (`{ tokens, sources, resolver }`) and the loader's `cwd` on `Project.cwd`. Adds `SwatchbookIntegration` to the public type surface. All additive — no behaviour change for existing consumers. Unblocks library-level emission wrappers that drive Terrazzo's programmatic `build()` without re-parsing.
