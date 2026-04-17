---
'@unpunnyfuns/swatchbook-blocks': minor
---

Add `ShadowPreview` and `BorderPreview` blocks. Each renders its composite tokens by applying them to a sample element, so the visual effect is legible — not just the sub-value string. Sub-values (offset, blur, spread, color for shadows; width, style, color for borders) appear next to the sample as a breakdown. `ShadowPreview` handles layered shadows (DTCG shadow values can be arrays) with a per-layer breakdown.
