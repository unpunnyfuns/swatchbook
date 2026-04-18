---
'@unpunnyfuns/swatchbook-addon': minor
---

Addon preview now resolves theme selection from an axis **tuple** rather than a composed name. New `swatchbookAxes` global (`Record<axisName, contextName>`) and `parameters.swatchbook.axes` per-story override take precedence over the existing `swatchbookTheme` / `parameters.swatchbook.theme` string form (still accepted for back-compat). The decorator writes one `data-<axisName>="<context>"` attribute per axis to `<html>` and the story wrapper — alongside the existing `data-theme` composed ID — giving upcoming CSS emission (#135) and toolbar (#134) work a stable target. A new `AxesContext` + `useActiveAxes()` hook exposes the tuple to consumer components.
