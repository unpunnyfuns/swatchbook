---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs: add a "For developers" section to the docs site

New top-level navbar entry alongside Blocks / Guides / Reference, with three pages aimed at people who want to work on swatchbook's code rather than consume it:

- **For developers** — landing page, the repo map, pointers to typical work shapes.
- **Architecture** — the one data structure everything revolves around (`Project`), plus the static build path and the dev/HMR path from token file to rendered block. Includes how the MCP server plugs in.
- **Sharp corners** — the "someone will bleed on this" list: Storybook manager-bundle JSX trap, atomic-save watcher pattern, React rules-of-hooks regressions, etc.

CONTRIBUTING.md on GitHub stays as the dev-setup source of truth; the docs-site section covers the how-does-it-work reference new contributors need for a mental model.
