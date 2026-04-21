---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

docs: restore `swatchbook-*` in each package README's title header

Every package README was headed with a one-word title (`# Addon`, `# Blocks`, `# Core`, `# MCP`). On npm's package page that renders as a standalone word stripped of context — a reader who lands on the tarball's own page via a search, deep link, or alert sees "# Addon" and has to hunt for what it's an addon *of*. Restored the `swatchbook-*` prefix so each README's title matches its published package name and re-establishes context on first scroll.
