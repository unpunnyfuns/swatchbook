---
"@unpunnyfuns/swatchbook-core": patch
---

Closes #833. Extends the layered test fixture (`packages/core/test/fixtures/layered/`) with composites and a multi-hop alias chain so the layered-loader path has real-data coverage for the same shapes the resolver-path reference fixture already exercises.

Before: 4 files, color-only, single-hop aliases. Real consumers using layered mode with composites would be the first to discover any bug in alias-through-composite resolution under that path.

Now:
- `base/ref.json` adds `dimension`, `duration`, `cubicBezier`, `fontFamily`, `fontWeight` primitives — the alias targets for the new composites.
- `base/sys.json` adds composite roles: `shadow.md` (single-layer shadow with aliased color + offsets), `border.default` (aliases `color.accent` which itself aliases `color.blue` — depth-2 chain), `transition.enter`, `typography.heading`. Also adds `color.fg` aliasing `color.text` for a plain depth-2 color chain.
- `modes/dark.json` re-aims `shadow.md.color` to `{color.white}` so the Dark overlay exercises composite-whole replacement.
- Existing tokens (`color.surface` / `text` / `accent`) and their overlays are unchanged — additive only, no test regressions.

New test file `load-layered-composites.test.ts` covers the new shapes with 6 assertions: composites load with `$type` intact, multi-hop color chain resolves transitively in Light, the same chain re-resolves when an intermediate target flips under an axis (Dark), composite sub-field flips when its alias target is re-aimed under an axis, composite alias chain depth ≥ 2 resolves, and the head re-aim case for brand-touched composites.

No source changes.
