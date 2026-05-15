---
'@unpunnyfuns/swatchbook-core': minor
---

`config.resolver` now accepts bare package specifiers (e.g. `@my/tokens/resolver.json`). Resolution prefers `cwd`-relative paths when the file is on disk — preserving every existing config form — and falls back to `node_modules` resolution from `cwd` otherwise, so token packages can ship a resolver that consumers reference directly without copying it into their tree.
