---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Tighten weak / smoke-only test assertions across packages — sweep from the audit's test-invariant-quality lens. Each previously-weak assertion now pins a meaningful, falsifiable invariant.

- `variance-analysis-layered.test.ts` (closes #930) — was silently passing when the fixture's `color.accent` wasn't actually multi-touch. Extended the layered fixture (`brands/brand-a.json`) so `color.text` is overridden by both `mode` and `brand` axes; the test now asserts the actual classifier output (`orthogonal-after-probe` with `touching: {mode, brand}`). Surfaced a separate docstring-vs-implementation discrepancy filed as #942.
- `prefers-reduced-motion.browser.test.tsx` — admitted in a comment it couldn't tell apart "initial-render default" from "useEffect set false". Now captures the full `observed[]` sequence + asserts `matchMedia` was actually called.
- `variance-analysis-reference.test.ts` — joint-case loop was `toBeTruthy()` per field; now pins the known Dark+Brand A case end-to-end: `permutationName` shape, `cartesianValueKey` matches `JSON.stringify(jointOverrides[...].$value)`.
- `cells.test.ts` — "default cell on each axis is the shared baseline" was a length-check; now asserts reference identity (`.toBe(baseline)`), the contract that lets `resolveAt` skip copies.
- `config-terrazzo-options.test.ts` — `terrazzoPlugins` test ended with `expect(entry).toBeDefined()`; now also asserts the listing populated alongside the plugin invocations.
- `computed-and-emit.test.ts` `get_color_formats` — `raw` field only had `.toBeDefined()`; now asserts `JSON.parse(raw.value)` round-trips with `colorSpace` + `components|channels`.
- `computed-and-emit.test.ts` `resolve_theme` — partial-tuple test asserted `toBeTruthy()` on every axis; now asserts equality to each axis's declared `default`.
- `token-introspection.test.ts` `get_token` — per-theme entries asserted only `toBeTruthy()`; now asserts Light-themed vs. Dark-themed value sets actually differ (a resolver bug emitting the same value across modes would slip through `toBeTruthy`).

Plus the smaller nits: dropped a no-op `expect(resolverPath).toBeDefined()` in `resolver-edge-cases.test.ts`, added `group: 'swatchbook/presets'` / `'swatchbook/chrome'` literal pins to two diagnostic-assertion tests where prose was the only signal, swapped a tight diagnostic-prose regex for substring match.
