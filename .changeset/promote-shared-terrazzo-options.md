---
"@unpunnyfuns/swatchbook-core": patch
---

Docs: restructure `guides/sharing-terrazzo-options` so the shared-options module pattern is the first section after the intro, with motivation (drift symptoms, what-swatchbook-owns) demoted below the example. Adds a "why this pattern, not a `config.terrazzo: TerrazzoConfig` field?" section explaining why swatchbook accepts plugin objects rather than ingesting a constructed Terrazzo config (closure-trapped plugin options; symmetric handling matches `tsconfig` `extends`).
