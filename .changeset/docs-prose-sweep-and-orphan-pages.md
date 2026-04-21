---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs: prose sweep + adopt two orphaned concept pages into the sidebar

**Prose sweep.** An audit across every live `.mdx` and each package README surfaced six clear pitch-language tells. Fixed five (kept two borderline "why axes, not themes" link-title italics as-is since they're page titles, not strawman setups):

- Root README and intro both had "Drop them into MDX pages and your token reference writes itself" — replaced with descriptive version naming the per-type previews explicitly.
- Addon reference: "those hooks just work wherever the addon is registered" → "the hooks resolve wherever the addon is registered".
- Authoring guide: "the blocks just work inside MDX" → "the blocks render inside MDX".
- Quickstart: "Takes ~5 minutes if you already have a Storybook project." → "Assumes an existing Storybook 10 project with the Vite builder. Install, register, author the first doc page."

**Orphan adoption.** `concepts/axes-vs-themes` and `concepts/theme-reactivity` existed as pages and were linked from the intro, but weren't listed in the home sidebar's Concepts category. Clicking those links landed on pages with no sidebar highlighting or breadcrumb context. Added both to the Concepts category; `axes-vs-themes` goes first (foundational "why"), `theme-reactivity` goes between diagnostics and token-pipeline (implementation-facing after the concept tour).
