# DTCG type coverage

Inventory of how each DTCG 2025.10 `$type` is rendered visually in swatchbook. "Visual rendering" means a dedicated block or a TokenDetail composite preview — not a raw text value in `TokenTable`. Anything that bottoms out in text is a gap, because the mission is to *show* what a token means, not just print its value.

Audit last run: 2026-04-18. File gap issues against the **DTCG type coverage** milestone.

## Coverage matrix

| `$type` | In `tokens-reference` | Dedicated block | `TokenDetail` preview |
| --- | --- | --- | --- |
| `color` | ✅ ref / sys / cmp | `ColorPalette` (grid) | swatch + hex |
| `dimension` | ✅ sys / cmp | `DimensionScale` (length / radius / size) | ❌ text only |
| `fontFamily` | ✅ ref only | ❌ — only surfaced via `typography` composite | ❌ text only |
| `fontWeight` | ✅ ref only | ❌ — only surfaced via `typography` composite | ❌ text only |
| `duration` | ✅ ref only | `MotionPreview` | ❌ text only |
| `cubicBezier` | ✅ ref only | `MotionPreview` | ❌ text only |
| `number` | ❌ not in fixture | — | — |
| `strokeStyle` | ❌ not in fixture | — | — |
| `typography` | ✅ sys | `TypographyScale` | pangram sample ✅ |
| `shadow` | ✅ sys / cmp | `ShadowPreview` | box-shadow card ✅ |
| `border` | ✅ sys / cmp | `BorderPreview` | border card ✅ |
| `transition` | ✅ sys / cmp | `MotionPreview` | animated ball ✅ |

## Confirmed gaps

- **`fontFamily` standalone** — rendered correctly inside a `typography` composite, but a standalone `font.ref.family.sans` token shows only as a JSON-stringified array in `TokenTable` and `TokenDetail`. Needs a sample-string block and a composite preview in `TokenDetail`.
- **`fontWeight` standalone** — same story. A `font.ref.weight.bold` token needs a visual that shows the *weight* (sample text at that weight), not just the number.
- **`duration` / `cubicBezier` in `TokenDetail`** — `MotionPreview` covers standalone duration and easing tokens at list level, but opening one in `TokenDetail` falls back to text. Extend `CompositePreview` with single-duration and single-easing cases (reuse the ball pattern from the `transition` composite).
- **`dimension` in `TokenDetail`** — consistency gap. `CompositePreview` renders no visual for dimension tokens even though `DimensionScale` exists. A single-row `DimensionScale`-style bar would close the loop.
- **`strokeStyle`** — not in the reference fixture. Spec has `solid` / `dashed` / `dotted` strings plus `{ dashArray, lineCap }` objects. Needs a fixture addition + a preview (either a new block or extend `BorderPreview`).
- **`number`** — not in the reference fixture. Typically used for opacities, line-height multipliers, z-index. Text-only rendering is probably defensible, but confirm by adding one to the fixture and verifying `TokenTable` handles it cleanly.

## Method

For each type:

1. `$type` present in `packages/tokens-reference/tokens/**`? (`grep '"\$type": "<name>"'`)
2. Which block(s) filter on that type? (`grep '\\$type !== '`)
3. Does `TokenDetail`'s `CompositePreview` have a branch? (`packages/blocks/src/TokenDetail.tsx`)
4. If only `TokenTable` shows it → gap.

## Follow-ups

Gap issues filed under the **DTCG type coverage** milestone. Each one closes by (a) surfacing the type in at least one visual block, and where applicable (b) extending `TokenDetail`'s `CompositePreview`, and (c) ensuring the reference fixture exercises it.
