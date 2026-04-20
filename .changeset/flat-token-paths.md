---
'@unpunnyfuns/swatchbook-core': major
'@unpunnyfuns/swatchbook-addon': major
'@unpunnyfuns/swatchbook-blocks': major
---

feat!: flat token paths, per DTCG `$type`

Token paths organize by DTCG `$type` at the root — `color.blue.500` alongside `color.surface.default`, `size.100` alongside `space.md`, `duration.fast` alongside `transition.enter`. Primitives and composites coexist under their type root with no tier prefix. CSS emission names follow the same shape: `--<prefix>-color-surface-default`, `--<prefix>-typography-body-font-family`. `DEFAULT_CHROME_MAP` points each chrome role at its corresponding flat path.

The reference and starter fixtures demonstrate the shape: per-type `.json` files under `tokens/` (`color.json`, `size.json`, `typography.json`, …) plus resolver modifier overlays under `tokens/themes/`.
