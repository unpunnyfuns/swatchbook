# DTCG type coverage

Inventory of how each DTCG 2025.10 `$type` is rendered visually in swatchbook. "Visual rendering" means a dedicated block or a `TokenDetail` composite preview — not a raw text value in `TokenTable`. Anything that bottoms out in text is a gap, because the mission is to *show* what a token means, not just print its value.

Scope is DTCG-spec types only. Terrazzo also parses `boolean`, `string`, and `link` tokens — those are Terrazzo-specific extensions, not in the spec, and intentionally out of scope.

Audit last run: 2026-04-18 (refreshed alongside the **Full DTCG type parity with Terrazzo** milestone).

## Coverage matrix

| `$type` | In `tokens-reference` | Dedicated block | `TokenDetail` preview |
| --- | --- | --- | --- |
| `color` | ✅ ref / sys | `ColorPalette` (grid) | swatch + hex |
| `dimension` | ✅ sys | `DimensionScale` (length / radius / size) | bar ✅ |
| `fontFamily` | ✅ ref only | `FontFamilySample` | sample text ✅ |
| `fontWeight` | ✅ ref only | `FontWeightScale` | sample text ✅ |
| `duration` | ✅ ref only | `MotionPreview` | animated ball ✅ |
| `cubicBezier` | ✅ ref only | `MotionPreview` | animated ball ✅ |
| `number` | ✅ ref only | — (text-only, acceptable) | — |
| `strokeStyle` | ✅ ref only | `StrokeStyleSample` | — (text-only) |
| `gradient` | ✅ ref only | `GradientPalette` | linear-gradient sample ✅ |
| `typography` | ✅ sys | `TypographyScale` | pangram sample ✅ |
| `shadow` | ✅ sys | `ShadowPreview` | box-shadow card ✅ |
| `border` | ✅ sys | `BorderPreview` | border card ✅ |
| `transition` | ✅ sys | `MotionPreview` | animated ball ✅ |

## Status

Every DTCG 2025.10 `$type` has a dedicated block, a `TokenDetail` preview, or both. `number` renders as raw text in `TokenTable` — acceptable because opacities, line-heights, and z-index slots have no meaningful visual beyond the number itself. The `strokeStyle` object form (`{ dashArray, lineCap }`) falls back to a textual notice in `StrokeStyleSample`; SVG stroke rendering is a future-work candidate.

## Out-of-scope types (Terrazzo extensions)

Terrazzo exposes `boolean`, `string`, and `link` in addition to the spec types. These aren't part of DTCG 2025.10 and don't appear in our reference fixture. Rendering them would duplicate Terrazzo's extension surface without adding spec-consumer value.

## Method

For each type:

1. `$type` present in `packages/tokens-reference/tokens/**`? (`grep '"$type": "<name>"'`)
2. Which block(s) filter on that type? (`grep '$type !== '`)
3. Does `TokenDetail`'s `CompositePreview` have a branch? (`packages/blocks/src/TokenDetail.tsx`)
4. If only `TokenTable` shows it → gap.

## Follow-ups

Gap issues go under the **Full DTCG type parity with Terrazzo** milestone. Each one closes by (a) surfacing the type in at least one visual block, and where applicable (b) extending `TokenDetail`'s `CompositePreview`, and (c) ensuring the reference fixture exercises it.
