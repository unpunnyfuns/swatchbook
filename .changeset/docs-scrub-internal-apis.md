---
'@unpunnyfuns/swatchbook-blocks': patch
---

Docs: stop documenting `emitCss`, `projectCss`, and `emitViaTerrazzo` as user-facing APIs. They remain exported by `@unpunnyfuns/swatchbook-core` so existing callers don't break, but the README, reference pages, concept pages, and integration guides no longer promote them. Users who want production asset emission should run Terrazzo's CLI against the same DTCG sources.
