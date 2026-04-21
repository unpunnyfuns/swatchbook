---
'@unpunnyfuns/swatchbook-core': patch
---

docs: split Docs nav into per-category top-level entries

The Docusaurus navbar now exposes Quickstart, Concepts, Blocks, Guides,
and Reference as discrete top-level items instead of a single collapsed
"Docs" link. `activeBaseRegex` on each entry highlights the pill for the
whole section — Reference excludes `/reference/blocks/*` so the Blocks
entry keeps the active style while browsing block pages.
