---
'@unpunnyfuns/swatchbook-core': minor
---

Add `emitViaTerrazzo(project, options)` — axis-aware wrapper around `@terrazzo/parser`'s programmatic `build()`. Auto-derives compound-selector permutations from `project.themes` (or `project.presets`, via `selection`), pins `variableName` to `cssVarPrefix`, and runs `@terrazzo/plugin-css` alongside any additional Terrazzo plugins the caller passes. Foundational for library-level platform emission (Tailwind `@theme`, CSS-in-JS accessors, Swift, Sass, …) without users re-deriving axis composition per plugin.

Also ships a pnpm patch for `@terrazzo/plugin-css-in-js@2.0.3` fixing a one-line bug where dashed path segments (`number.line-height.loose`, `color.accent.bg-hover`) crash the build. File upstream separately.
