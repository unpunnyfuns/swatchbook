---
'@unpunnyfuns/swatchbook-core': patch
---

docs: add CONTRIBUTING.md

First-class contributor guide covering dev setup (Node 24, pnpm 10.33.0, `pnpm install`, `pnpm dev`), the full pre-commit check chain (`pnpm -r format && pnpm turbo run lint typecheck test`), code conventions (ESM only, explicit extensions, `#/*` subpath imports, no CSS-in-JS, oxlint + oxfmt), test structure rules (flat, no nested describe, prose names), PR title + body conventions (Conventional Commits, lowercase scope, Milestone / Closes / Plan impact), and the changeset policy (patch for docs, minor for features and breakings pre-1.0).
