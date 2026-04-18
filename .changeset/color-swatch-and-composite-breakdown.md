---
'@unpunnyfuns/swatchbook-blocks': minor
---

`TokenDetail` grows two new visuals.

- **Color swatch** — opening a `color` token now shows a two-surface swatch (the token on a light and dark backdrop) in the composite preview area, alongside the existing inline swatch next to the resolved value line. Lets viewers gut-check contrast without leaving the detail pane.
- **Composite sub-value breakdown** — `typography`, `shadow`, `border`, `transition`, and `gradient` tokens now render a labelled field list underneath the composite preview. Shadow breakdowns group multi-layer tokens with a "Layer N" header; gradient breakdowns list each stop by position percentage.
