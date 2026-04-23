---
'@unpunnyfuns/swatchbook-integrations': minor
---

Replace `/tailwind`'s hardcoded `DEFAULT_ROLES` map with a dynamic role derivation that walks the project's default-theme token graph at render time and classifies each token into a Tailwind scale by `$type` + path. Color tokens → `color`, `space.*` / `spacing.*` dimensions → `spacing`, `radius.*` / `borderRadius.*` / `border-radius.*` dimensions → `radius`, shadows → `shadow`, font families → `font`. Font-size-ish dimensions (`font.size.*`, `text.*`) are intentionally skipped because Tailwind's `--text-*` entries want size + line-height pairs that this preview integration doesn't synthesize.

Result: zero-config now works for every DTCG project shape, not just the one that matches the reference fixture. A project using `color.background.*` / `spacing.small` / `borderRadius.round` gets usable Tailwind utilities out of the box; previously it got a `@theme` block of `var(--undefined-…)` references.

The `roles` option still wins — pass your own map to pin a curated subset, rename scales, or emit into Tailwind scales the derivation doesn't cover.

Breaking (pre-1.0, minor): projects relying on the reference-fixture shape will now additionally emit `--color-<prefix>-palette-*` utilities etc. for every palette token. This is extra utility surface, not a removal; existing class names keep working.
