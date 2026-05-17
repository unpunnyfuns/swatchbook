---
"@unpunnyfuns/swatchbook-core": patch
---

Closes #828. Internal-only — every `#/`-prefixed import in `packages/core/test/*.ts` now carries an explicit `.ts` extension, matching the project convention (CLAUDE.md: "explicit extensions always"). Every other package's tests already followed the rule; core/test was the outlier with 22 missing-extension imports across 17 files.

No runtime or API impact — the imports resolve to the same modules either way (`package.json#imports` extension-agnostic), but TypeScript + tsdown + node strip-types all prefer the explicit form.
