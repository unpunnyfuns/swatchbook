---
"@unpunnyfuns/swatchbook-core": patch
---

First half of #824. Extracts three helpers that were duplicated across core modules into dedicated files:

- `canonicalKey(tuple)` → `packages/core/src/tuple-key.ts`. Was inlined in both `resolve-at.ts` and `joint-overrides.ts`. Pure string ops; no runtime deps so the browser-safe `@unpunnyfuns/swatchbook-core/resolve-at` subpath stays Terrazzo-free.
- `valueKey(token)` → `packages/core/src/value-key.ts`. Was inlined in `variance-analysis.ts`, `joint-overrides.ts`, and `variance-by-path.ts` under three different signatures (`TokenNormalized | undefined`, `unknown`, `TokenMap[string] | undefined`) with identical bodies. Unified on a structural input type `{$value?: unknown} | undefined` so the helper doesn't pull `@terrazzo/parser` into its import graph.
- `cssEscape(value)` → `packages/core/src/css-escape.ts`. Was inlined as `cssEscape` in `css-axis-projected.ts` and `cssEscapeAttr` in `emit-via-terrazzo.ts` — same body, different name; collapsed to a single export. `cssEscapeAttr` callers renamed to `cssEscape`.

`jointOverrideKey` (public API) still re-exports through `joint-overrides.ts` and now just delegates to `canonicalKey`. No behavioural change; identical CSS output, identical snapshot keys.

`dataAttr` (3 sites across core/addon/blocks) and `makeCssVar` (2 sites with confirmed Terrazzo-vs-hand-rolled drift) need a subpath-export decision; left for follow-up PRs.
