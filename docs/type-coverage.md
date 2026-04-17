# DTCG type coverage

Inventory of how each DTCG 2025.10 `$type` is rendered visually in swatchbook. "Visual rendering" means a dedicated block or a TokenDetail composite preview — not a raw text value in `TokenTable`. Anything that bottoms out in text is a gap, because the mission is to *show* what a token means, not just print its value.

Audit last run: 2026-04-18 (refreshed after the milestone closed). File any new gaps against the **DTCG type coverage** milestone.

## Coverage matrix

| `$type` | In `tokens-reference` | Dedicated block | `TokenDetail` preview |
| --- | --- | --- | --- |
| `color` | ✅ ref / sys / cmp | `ColorPalette` (grid) | swatch + hex |
| `dimension` | ✅ sys / cmp | `DimensionScale` (length / radius / size) | bar ✅ |
| `fontFamily` | ✅ ref only | `FontFamilySample` | sample text ✅ |
| `fontWeight` | ✅ ref only | `FontWeightScale` | sample text ✅ |
| `duration` | ✅ ref only | `MotionPreview` | animated ball ✅ |
| `cubicBezier` | ✅ ref only | `MotionPreview` | animated ball ✅ |
| `number` | ✅ ref only | — (text-only, acceptable) | — |
| `strokeStyle` | ✅ ref only | `StrokeStyleSample` | — (text-only) |
| `typography` | ✅ sys | `TypographyScale` | pangram sample ✅ |
| `shadow` | ✅ sys / cmp | `ShadowPreview` | box-shadow card ✅ |
| `border` | ✅ sys / cmp | `BorderPreview` | border card ✅ |
| `transition` | ✅ sys / cmp | `MotionPreview` | animated ball ✅ |

## Status

All DTCG 2025.10 primitives and composites now have either a dedicated block, a `TokenDetail` preview, or both. `number` tokens render as raw values in `TokenTable` — defensible because opacities / line-heights / z-index slots have no meaningful visual beyond the number itself. The `strokeStyle` object form (`{ dashArray, lineCap }`) falls back to a textual notice in `StrokeStyleSample`; if we later add SVG stroke rendering, this doc should be updated.

## Method

For each type:

1. `$type` present in `packages/tokens-reference/tokens/**`? (`grep '"\$type": "<name>"'`)
2. Which block(s) filter on that type? (`grep '\\$type !== '`)
3. Does `TokenDetail`'s `CompositePreview` have a branch? (`packages/blocks/src/TokenDetail.tsx`)
4. If only `TokenTable` shows it → gap.

## Follow-ups

Gap issues filed under the **DTCG type coverage** milestone. Each one closes by (a) surfacing the type in at least one visual block, and where applicable (b) extending `TokenDetail`'s `CompositePreview`, and (c) ensuring the reference fixture exercises it.
