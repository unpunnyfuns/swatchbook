---
'@unpunnyfuns/swatchbook-core': patch
---

Mark `emitCss`, `projectCss`, `emitTypes`, `emitViaTerrazzo`, and their associated option / result types (`EmitCssOptions`, `EmitViaTerrazzoOptions`, `EmitSelectionEntry`, `EmittedFile`, `ParserInput`) as `@internal`. Exports stay in place to preserve 0.13-era call sites, but editors that honour the tag will stop suggesting them to consumers. Actual removal waits for a future breaking window.
