---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-addon`: add `emitMode: 'cartesian' | 'projected'` option (default `'cartesian'`) controlling which CSS emitter populates the `virtual:swatchbook/tokens` module's `css` export. `'cartesian'` keeps the current behavior (compound-selector tuple blocks via `projectCss`); `'projected'` switches to the axis-projection emitter added in #771 (one `:root` baseline plus single-attribute cell blocks via `emitAxisProjectedCss`). Purely additive — every existing consumer stays on cartesian without doing anything.
