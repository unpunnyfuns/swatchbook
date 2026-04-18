---
'@unpunnyfuns/swatchbook-blocks': minor
---

Add `TokenNavigator` block: expandable tree view of the token graph keyed on dot-path segments. Complements the flat `TokenTable` and the typed `ColorPalette` with an explorable hierarchy. Interior groups show child counts; leaves show a `$type` pill plus an inline preview (reuses `DimensionBar` / `ShadowSample` / `BorderSample` / `MotionSample` / `formatColor` for per-type visuals). Props: `root?` to mount at a subtree, `initiallyExpanded?` for default open-depth (default `1`), and `onSelect?(path)` for custom click handling — when omitted, clicking a leaf opens an inline slide-over with `<TokenDetail>` and a close button. Keyboard: Enter/Space toggles groups and activates leaves.
