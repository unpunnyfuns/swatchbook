---
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-addon': minor
---

Drop the composed `data-<prefix>-theme="<tuple name>"` attribute. The per-axis attributes (`data-<prefix>-<axis>="<context>"`) are the actual scoping surface — the smart CSS emitter targets single-axis selectors plus joint compounds across multiple, never `[data-*-theme]`. The composed attribute was a v0.5-era artifact from before axes landed.

- `themeAttrs(prefix, tuple)` (blocks): signature change. Now takes the active tuple and returns per-axis attrs + the stable `data-swatchbook-block` marker + wrapper classes. Replaces the old `themeAttrs(prefix, themeName)` shape.
- `perAxisAttrs(prefix, tuple)` (blocks): new helper for elements that want per-axis cell scoping without block-wrapper chrome — used by `AxisVariance` so each grid swatch's CSS vars resolve at the cell's tuple instead of the document root's active tuple. **Fixes a visual bug**: grid swatches previously all showed the active tuple's color because the per-cell `data-<prefix>-theme` they wrote had zero CSS rules keyed against it.
- Preview decorator (addon): stops writing `data-<prefix>-theme` on `<html>` and the story wrapper.
- `ProjectData.themeNameForTuple` / `TokenDetailData.themeNameForTuple` (blocks): removed. Synthesise tuple names locally with `tupleToName` if needed.
