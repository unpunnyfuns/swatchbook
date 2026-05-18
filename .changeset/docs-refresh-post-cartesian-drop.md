---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-switcher": patch
---

Closes #888. Refreshes the npm landing page + apps/docs reference against the current post-cartesian-drop public API. The single biggest user-visible debt heading into 0.60.

**`packages/core/README.md`** — rewritten Usage example (removed `permutationsResolved` access; shows `defaultTokens` + `resolveAt`), added Browser-safe subpaths section (5 subpaths), updated Boundaries to reference `snapshot-for-wire` instead of removed `permutationsResolved` projections.

**`apps/docs/docs/reference/core.mdx`** — removed sections for `Permutation` / `ResolvedPermutation` / `resolvePermutation` (none exported anymore); rewrote `AxisVarianceResult` as the discriminated union it actually is (`kind: 'constant' | 'single' | 'multi'` with cardinality-typed `varyingAxes` tuples + the `axis: string` shortcut on the `single` variant); rewrote `Config` section as the new discriminated union (`ResolverConfig | LayeredConfig | PlainConfig`); added Browser-safe subpaths table; added `Cells` / `JointOverride` / `JointOverrides` / `ResolveAt` type docs; replaced "per-permutation token snapshots" framing with "per-axis cells."

**`apps/docs/docs/reference/switcher.mdx`** — removed the nonexistent `themes?:` prop documentation and the `SwitcherPermutation` type (neither has ever been in the switcher's actual exports — `packages/switcher/src/index.ts` only exports `ThemeSwitcher` / `ThemeSwitcherProps` / `SwitcherAxis` / `SwitcherPreset`). Updated the closing paragraph to drop the `Project.permutations` reference.

**`apps/docs/docs/reference/config.mdx`** — added discriminated-union framing to "Picking a theming input" (`Config = ResolverConfig | LayeredConfig | PlainConfig`; invalid combos are compile errors); replaced cartesian framing on `axes` docs with singleton-tuple framing (`Σ(axes × (contexts - 1))`, joint divergences via `Project.jointOverrides`).

Patch bump because the docs ship via the docs-site snapshot — without a changeset, the fix only reaches `/next/` instead of `/`.
