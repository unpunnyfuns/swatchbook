---
'@unpunnyfuns/swatchbook-core': major
'@unpunnyfuns/swatchbook-addon': major
'@unpunnyfuns/swatchbook-blocks': major
---

Drop the explicit-layers theming input. The DTCG 2025.10 resolver is now the sole theming input — `Config.themes`, the `ThemeConfig` type, and `resolveThemingMode` are all gone. Consumers with a layered config must move to a `resolver.json`.

Theme names come from the resolver's modifier contexts: single-axis resolvers use the modifier value directly (context `Light` → theme name `Light`), multi-axis resolvers keep Terrazzo's JSON-encoded permutation ID. Pick sensible modifier context names in your resolver; what you write is what consumers see.

The `themingMode` field on the virtual module is also removed — there's only one mode to be in.
