---
'@unpunnyfuns/swatchbook-core': minor
---

Tighten `Config.cssOptions`: `filename` and `skipBuild` are now stripped from the allowed type in addition to `variableName` and `permutations`. Neither was ever honored end-to-end — `filename` is overridden to the in-memory capture name, and `skipBuild: true` would silently null out the listing's `previewValue`. Removing them from the type turns a silent no-op into a compile-time signal.

Deprecated plugin-css knobs (`baseSelector`, `baseScheme`, `modeSelectors`) are still type-accepted because they sit on `CSSPluginOptions`, but are runtime-inert under swatchbook's permutation-based emission. Setting any of them now produces a `swatchbook/css-options` warn diagnostic that lists the offending keys and points at the replacement, matching the validation pattern already used for `default` / `presets` / `chrome` / `disabledAxes`.

Breaking (pre-1.0, minor): configs that were setting `filename` or `skipBuild` on `cssOptions` — which had no effect in practice — will now fail to typecheck. Delete the field.
