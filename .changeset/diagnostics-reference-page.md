---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Add `reference/diagnostics.mdx` — a catalog of every `swatchbook/<group>` diagnostic the core can emit, with severity, trigger condition, and what to check for each known message. Also documents the structured `swatchbook: failed to transform token "<path>" at permutation <tuple>…` runtime emit-error format. Cross-linked from `reference/core.mdx` (`Project.diagnostics`), `reference/addon.mdx` (Design Tokens panel), and `intro.mdx` (How to read these docs). No package source changes; the patch changeset is so the next release's snapshot rebuild picks up the new page.
