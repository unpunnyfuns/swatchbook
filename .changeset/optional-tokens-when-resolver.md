---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
---

`Config.tokens` is now optional when `config.resolver` is set. The resolver's own `$ref` targets fully determine what gets loaded, and `Project.sourceFiles` exposes every file touched so the addon's Vite plugin can derive HMR watch paths without a parallel `tokens` glob. Supplying `tokens` alongside `resolver` still works — the watch paths union with the resolver-derived set, useful when you want HMR to watch broader directories than the resolver references.

Plain-parse (no resolver, no axes) and layered (`axes` set) modes still require `tokens` — the loader has no other starting point. Configs that omit `resolver`, `axes`, AND `tokens` now throw a descriptive error at load time.
