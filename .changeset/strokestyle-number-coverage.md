---
'@unpunnyfuns/swatchbook-blocks': minor
---

New `StrokeStyleSample` block renders DTCG `strokeStyle` tokens — string-form values (`solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `outset`, `inset`) display as a visible horizontal line at the computed `border-top-style`; object-form values (`{ dashArray, lineCap }`) render a textual fallback because CSS `border-style` has no matching primitive. Companion additions to the reference fixture exercise both forms plus a `number` group (opacities + line-height multipliers) so the full DTCG primitive surface is now covered.
