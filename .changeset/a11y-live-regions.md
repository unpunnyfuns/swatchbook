---
'@unpunnyfuns/swatchbook-blocks': patch
---

Add `aria-live` polite live regions for status transitions that were previously visual-only:

- `<CopyButton>` — copy success transition. The icon variant's `✓` glyph is `aria-hidden`; the new sr-only live region announces "Copied" for SR users.
- `<TokenTable>` + `<TokenNavigator>` — search match-count. The caption text already updates visually, but `<caption>` isn't re-announced by AT mid-interaction. New sr-only live regions announce `N tokens matching "<query>"` as the user types.

Each component carries its own component-namespaced sr-only utility class (`__sr-status` / `__sr-only`) following the existing pattern in `ColorTable`. A future tidy could extract a shared utility.

Audited finding from #932 scoped to the two clear wins; theme/axis-flip page-level announcements are deferred — that wants a debounced single live region in the addon preview decorator and rises above this PR's risk envelope. Gamut warnings already carry `aria-label="out of gamut"` everywhere (`TokenDetail`, `TokenTable`, `ColorPalette`, `ColorTable`); audit's finding there was outdated.
