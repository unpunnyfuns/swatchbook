---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-mcp": patch
---

Closes #889. Adds `@unpunnyfuns/swatchbook-core/themes` subpath consolidating the "themes-a-project-surfaces" enumeration + the `tupleToName` join. Eliminates duplicated `enumerateThemeNames` / `buildTupleByName` / inline `tupleToName` impls across 4 packages.

**New exports** (subpath: `/themes`):
- `tupleToName(axes, tuple)` — synthesizes the canonical theme name (`axisValues.join(' · ')` in declared axis order) for the `data-<prefix>-theme` attribute. Same form `Project.cells` keys against.
- `enumerateThemes({ axes, presets, defaultTuple })` — iterates default tuple + per-axis non-default singletons + presets, deduped by name. Same order the loader produces.
- `ThemeEntry`, `ThemeEnumAxis`, `ThemeEnumPreset` types.

Pure functions, structural input types — no `Project` import, no Terrazzo parser, no Node deps.

**Consumer migrations:**
- `packages/addon/src/preset.ts` — `enumerateThemeNames` (16-line local impl with its own inline `tupleToName`) replaced with `enumerateThemes(project).map(t => t.name)`.
- `packages/addon/src/preview.tsx` — `matchPermutationName` now wraps `tupleToName(virtualAxes, tuple)` instead of inlining the join.
- `packages/blocks/src/internal/use-project.ts` — local `tupleToName` helper deleted; consumers import from core subpath.
- `packages/mcp/src/server.ts` — local `buildTupleByName` (20-line preset-fill impl) and `tupleToName` (5-line) deleted; `buildTupleByName` now wraps `enumerateThemes(project)`.

The internal `permutationID` in `core/types.ts` stays (still used by the loader's per-tuple keys via `Object.values(input).join(…)`); it's a slightly different signature (joins `Object.values` not `axes.map`) and remains an internal detail. The new `tupleToName(axes, tuple)` is the consumer-facing replacement that's explicit about axis ordering.

Sixth core subpath (joining `/fuzzy`, `/resolve-at`, `/css-var`, `/data-attr`, `/snapshot-for-wire`, `/match-path`). Pre-1.0 minor bump on core (new public subpath); patch on consumer packages.
