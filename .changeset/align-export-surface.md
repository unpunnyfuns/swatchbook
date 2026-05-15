---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': patch
---

Align the public export surface with the reference docs ahead of v1.0.

**Retracted from `@unpunnyfuns/swatchbook-core`** (no first-party consumers, removed from the package's public surface):

- `emitTypes`, `emitCss`, `EmitCssOptions`
- `emitViaTerrazzo`, `EmitViaTerrazzoOptions`, `EmitSelectionEntry`, `EmittedFile`
- `dataAttr`

`projectCss` stays public — it has real first-party consumers and is now documented in the [core reference](https://unpunnyfuns.github.io/swatchbook/reference/core). For production-platform emission, use Terrazzo's CLI directly.

**Newly documented surface** (no API change, just docs that catch up to reality):

- core: `projectCss`, `analyzeAxisVariance`, `CHROME_ROLES`, `DEFAULT_CHROME_MAP`, `ChromeRole`, `AxisVarianceResult`, `VarianceKind`, `ResolvedPermutation`, `TokenMap`, `ListedToken`, `DiagnosticSeverity`, `ParserInput`
- addon: `AddonOptions` typed shape; phantom `GLOBAL_KEY` removed from the exported-constants example
