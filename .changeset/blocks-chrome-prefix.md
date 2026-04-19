---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-core': patch
---

Fix block chrome rendering when `cssVarPrefix` is anything other than `sb`. Blocks were referencing their own chrome (surface, borders, text, accent) via literal `var(--sb-color-sys-*)`, which fell through to fallback values for every project on the post-0.2.0 default prefix (`swatch`) or any custom prefix. Each block wrapper now spreads a CSS custom-property alias layer redirecting the `--sb-*` names to the project's actual prefix; chrome renders correctly regardless of prefix.
