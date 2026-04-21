---
'@unpunnyfuns/swatchbook-core': patch
---

docs: wire Docusaurus Infima theming through a swatchbook token pipeline

`apps/docs/tokens/` now holds a minimal DTCG set — a brand / neutral
palette plus per-mode surface, text, primary, and code role tokens.
A small build-time script (`apps/docs/scripts/build-tokens.mts`) loads
it through `loadProject` / `projectCss` from swatchbook-core and emits
`apps/docs/src/css/tokens.generated.css`, post-processing the
`[data-sb-theme="…"]` selectors into Docusaurus's `[data-theme="…"]`
shape so the per-mode vars track the Infima toggle on `<html>`.

`custom.css` drops its hand-tuned hex values and maps Infima variables
onto the emitted `--sb-color-*` vars (primary ramp, surfaces, text,
code chrome). Changes to `apps/docs/tokens/*.json` now flow into the
live Infima theme on rebuild — the docs site dogfoods the addon's own
token pipeline instead of maintaining a parallel colour list.
