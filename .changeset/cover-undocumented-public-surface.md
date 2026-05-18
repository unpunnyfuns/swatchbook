---
'@unpunnyfuns/swatchbook-core': patch
---

Cover the public-surface exports that shipped without doc entries:

- Three new core subpaths landed in earlier PRs (`/themes`, `/match-path`, `/style-element`) get rows in the "Browser-safe subpaths" table in `core.mdx` and the matching list in `packages/core/README.md`.
- `SwatchbookToken` interface gets its own type section in `core.mdx`; `TokenMap` is now typed against it instead of leaking `TokenNormalized`.
- `jointOverrideKey(axes)` gets a one-line entry in the Functions section.
- `presetTuple(preset, axes, defaults)` from `@unpunnyfuns/swatchbook-switcher` gets a section in `switcher.mdx`.
- `useOptionalSwatchbookData()` gets a hook entry in `blocks/hooks.mdx` next to `useSwatchbookData`.
- Color-formatting exports from blocks (`formatColor`, `COLOR_FORMATS`, `ColorFormat`, `FormatColorResult`, `NormalizedColor`) get a section in `blocks/utility.mdx`.
- `MotionSpeed` type gets a brief block in `blocks/samples.mdx` alongside `MotionSample`.

Docs-only patch bump per the standing snapshot policy.
