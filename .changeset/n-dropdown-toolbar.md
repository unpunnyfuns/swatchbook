---
'@unpunnyfuns/swatchbook-addon': minor
---

Toolbar now renders one dropdown per modifier axis instead of a single flat list of composed theme names. For a project with independent `mode` and `brand` axes you get two controls (`mode: Light`, `brand: Brand A`) that combine into any valid permutation; the synthetic single-theme axis still presents as one "Theme" dropdown so UX is unchanged for projects without a resolver. Each dropdown shows the axis contexts with the current selection checked, surfaces the axis description in a tooltip when present, and updates both `swatchbookAxes` (the canonical tuple) and `swatchbookTheme` (the composed permutation ID for the panel + legacy consumers) atomically. The `alt+T` shortcut now cycles the primary (first) axis's contexts while pinning the rest of the tuple.
