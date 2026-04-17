---
'@unpunnyfuns/swatchbook-blocks': minor
---

Add `DimensionScale` block: renders dimension tokens (`space.*`, `radius.*`, `size.*`, or any `$type: 'dimension'`) as visible bars sized to the token's actual value. Three visualization kinds — `'length'` (horizontal bar, default), `'radius'` (sample square with the token applied as `border-radius`), `'size'` (square box sized to the token). Bars wider than 480px are capped with a visible marker so extreme tokens don't break the layout. Sorted ascending by computed pixel value; ties broken by path.
