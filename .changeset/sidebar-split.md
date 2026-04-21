---
'@unpunnyfuns/swatchbook-core': patch
---

docs: split docs sidebar per section so left rail stops duplicating navbar

The left sidebar listed every category (Blocks / Concepts / Guides /
Reference) as a collapsible header, which mirrored the navbar entries
added in the previous patch. Split the single `docs` sidebar into five
section-scoped sidebars (`home`, `concepts`, `blocks`, `guides`,
`reference`) and bind each navbar entry with `type: 'docSidebar'` +
`sidebarId`. The left rail now lists only the pages in the current
section.

Versioned sidebar snapshots (0.4 / 0.5 / 0.6) were rewritten to the new
shape — navbar `docSidebar` entries resolve per-version, so leaving
older versions on the old `docs` sidebar would 500 every page under
`/0.4/…` etc.
