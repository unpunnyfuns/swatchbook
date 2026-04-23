---
'@unpunnyfuns/swatchbook-core': minor
---

New config props on `defineSwatchbookConfig` for sharing Terrazzo plugin options with the internal build pipeline: `cssOptions`, `listingOptions`, and `terrazzoPlugins`. Consumers who run their own Terrazzo CLI in production can now align swatchbook's docs-side emission with whatever their production build produces — no more drift between the hex values / CSS variable names / per-platform identifiers the docs show and what actually ships.

- `cssOptions?: Omit<CSSPluginOptions, 'variableName' | 'permutations'>` forwards to the internal `plugin-css` instance. `legacyHex`, `colorDepth`, `transform`, and everything else plugin-css accepts flow through; `variableName` and `permutations` stay managed because swatchbook's axis composition depends on them.
- `listingOptions?: Omit<TokenListingPluginOptions, 'filename'>` forwards to the internal `plugin-token-listing`. Register platforms beyond `css` (swift, android, figma, custom name functions) and `listing[path].names.<platform>` populates for block consumption.
- `terrazzoPlugins?: readonly Plugin[]` adds extra Terrazzo plugins alongside swatchbook's internal two. Required when `listingOptions.platforms` references anything outside the built-in `css` entry — the referenced plugin has to be loaded in the build.

Consumers who don't run a separate Terrazzo build leave all three unset and nothing changes. The idiomatic share-across-configs pattern is a single file that exports the shared options and imports into both `terrazzo.config.ts` and `swatchbook.config.ts`.
