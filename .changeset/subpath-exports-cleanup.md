---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": minor
---

Closes #834.

**`@unpunnyfuns/swatchbook-core`** — documents why the `./resolve-at` and `./fuzzy` subpath exports exist (browser-safe, no Terrazzo parser transitively). They're load-bearing for the addon's preview bundle and any browser consumer, not just internal organization leaking through. Source-file JSDoc updated; no API changes.

**`@unpunnyfuns/swatchbook-addon`** — drops four internal-only constants from the package barrel (`ADDON_ID`, `AXES_GLOBAL_KEY`, `PARAM_KEY`, `VIRTUAL_MODULE_ID`). None had external consumers in this workspace; the manager/preview/blocks codebase imports them via `#/constants.ts` directly. Pre-1.0 minor bump for the public-surface narrowing.

Sibling `RESOLVED_*` constants and channel event names (`INIT_EVENT`, `HMR_EVENT`, etc.) remain unexported; they're Vite-internal markers (`\0`-prefixed virtual module IDs) or addon-private channel names that consumers shouldn't wire against.
