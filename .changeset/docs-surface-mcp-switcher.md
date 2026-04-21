---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs: surface the full package set across indexes

Several places still listed the pre-v0.10 three-package story (core / addon / blocks) and omitted switcher + mcp:

- Root `README.md` — added the `mcp` row to the package table.
- `CONTRIBUTING.md` — expanded the "everything user-facing lives under…" list and the changeset rule to cover all five published packages.
- `packages/switcher/README.md` — created from scratch; the package shipped without one. Covers install, usage, exported surface, and where it's consumed inside the repo.
- `apps/docs/docs/intro.mdx` — added a short "For AI agents" section pointing at the MCP server, plus updated "How to read these docs" to include `mcp` in the Reference list and added the new Developers section.
