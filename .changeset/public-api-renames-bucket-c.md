---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-switcher': minor
'@unpunnyfuns/swatchbook-integrations': minor
'@unpunnyfuns/swatchbook-mcp': minor
---

Public API renames for clarity. Breaking, clean break (no deprecated aliases).

**blocks**
- `FontFamilySample` → `FontFamilyPreview`, `StrokeStyleSample` → `StrokeStylePreview`. Both render the whole matching collection, like the rest of the `*Preview` family; the `*Sample` names implied a single token.
- `DimensionKind` → `DimensionVisual`, and its `kind` prop → `visual` (it selects the visualization style, distinct from the type discriminators elsewhere called `kind`).
- Removed the unused `presets` / `disabledAxes` fields from `ProjectSnapshot`.

**addon**
- Per-story `parameters.swatchbook.permutation` → `themeName` (it holds a composed theme-name string, not a permutation).
- Removed the dead `parameters.swatchbook.theme` alias and the dead `swatchbookTheme` global — neither was read or written.
- `SwatchbookPluginOptions` → `SwatchbookTokensPluginOptions`.
- Removed the unused `PARAM_KEY` export.

**mcp**
- The `get_color_contrast` tool's output field `ratio` → `value` (in the APCA branch it carries a signed Lc score, not a ratio).

**core**
- Removed the unused `Diagnostic.column` field.

Migration: rename the imports, props, and parameters above. `switcher` and `integrations` have no API changes but version with the fixed group.
