---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-core`: drop `projectCss` and the supporting `packages/core/src/emit.ts` module. The smart `emitAxisProjectedCss` (default since v0.54) becomes the single emitter. Also drops the unused `emitTypes` helper (the addon's `preset.ts` has its own `renderTokenTypes`).

`@unpunnyfuns/swatchbook-addon`: drop the `AddonOptions.emitMode` option and the `composeProjectCss` dispatch helper. With only one emitter there's no dispatch to do; the addon's plugin calls `emitAxisProjectedCss` directly.

`@unpunnyfuns/swatchbook-mcp`: `emit_css` tool calls `emitAxisProjectedCss(project)` directly. Tool description updated to describe the smart-emit shape (`:root` baseline + per-axis singleton cells + compound joint-override blocks + chrome alias trailer).

`apps/docs/scripts/build-tokens.mts`: switches to `emitAxisProjectedCss`.

Pre-1.0 breaking change for consumers who explicitly imported `projectCss` from core or set `emitMode: 'cartesian'` on the addon. Production consumers were on the smart-emit default already.
