---
'@unpunnyfuns/swatchbook-core': minor
---

CSS emission now keys per-axis instead of per-composed-theme. Multi-axis projects emit one `:root` block carrying the default-tuple values plus one block per non-default cartesian tuple, each keyed on a compound attribute selector in `Project.axes` order (`[data-mode="Dark"][data-brand="Brand A"] { … }`). Every var is redeclared per tuple — flat emission stays correct when axes collide at the same token path (`brand-a.json` overriding `color.sys.surface.default` already set by `mode.dark`), where nested cascading would need cross-axis collision analysis. Single-axis projects (one resolver modifier, or the synthetic `theme` axis) keep the familiar `[data-theme="…"]` shape. `emitCss` takes a new optional `axes` in `EmitCssOptions`; `projectCss` routes `project.axes` in by default.
