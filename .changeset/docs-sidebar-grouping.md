---
'@unpunnyfuns/swatchbook-core': patch
---

Fix two discoverability regressions from the previous docs restructure:

- Split `guides/integrations.mdx` back into `guides/integrations/{index,tailwind,css-in-js}.mdx`. The merged single-page form was terser but readers scanning the Guides sidebar couldn't see that Tailwind or CSS-in-JS were covered — the library names didn't surface. Three pages under an "Integrations" sidebar category makes both the scope and each integration visible at a glance.
- Group the Reference sidebar into three categories — **Packages** (addon / core / config / mcp), **Blocks** (index / overview / inspector / samples / utility / hooks), **Model** (axes / token-pipeline). Previously eleven flat entries mixed these kinds; grouping reads as an index, not a laundry list.
