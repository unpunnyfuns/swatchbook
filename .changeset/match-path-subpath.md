---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-mcp": patch
---

Closes #890. Consolidates the two divergent path-matchers onto a single `@unpunnyfuns/swatchbook-core/match-path` subpath:

- `packages/blocks/src/internal/use-project.ts:globMatch` (5-line prefix matcher; treated `color.*` as "any descendants")
- `packages/mcp/src/match.ts:matchPath` (full mid-string `*` / `**` matcher; treated `color.*` as strict single-segment per conventional glob spec)

The blocks version was a documented narrow subset; the audit (#887 worth-a-PR #8) flagged them as "diverged despite a comment claiming parity." On closer inspection they're genuinely divergent — different semantic for `color.*`. Going with the **conventional glob spec** as the unified semantics (mcp's version): `*` matches a single segment, `**` matches any number of segments. This is a pre-1.0 minor break for blocks' `filter` prop.

**Blocks-side migration:** any consumer passing `filter="color.*"` to a block (`<ColorPalette>`, `<ColorTable>`, `<TokenTable>`, `<TypographyScale>`, `<DimensionScale>`, etc.) expecting "all descendants of color" needs to update to `filter="color.**"`. The single `*` now means exactly one segment after the prefix. The doc-site MDX (`apps/storybook/src/docs/*`, `apps/docs/docs/quickstart.mdx`, `apps/docs/docs/guides/authoring-doc-stories.mdx`, `apps/docs/docs/reference/blocks/*.mdx`) and every blocks test fixture is migrated in this PR.

**Touched files:**
- New `packages/core/src/match-path.ts` + `./match-path` subpath in core's `package.json` exports + tsdown entry.
- `packages/mcp/src/server.ts` — imports `matchPath` from the core subpath; deleted `packages/mcp/src/match.ts`.
- `packages/blocks/src/internal/use-project.ts` — `globMatch` export removed; the 13 consuming blocks (`ColorTable`, `ColorPalette`, `TokenTable`, `TypographyScale`, `OpacityScale`, `FontWeightScale`, `FontFamilySample`, `DimensionScale`, `MotionPreview`, `ShadowPreview`, `BorderPreview`, `StrokeStyleSample`, `GradientPalette`) import `matchPath` from the core subpath directly.
- Test moved: `packages/mcp/test/match.test.ts` → `packages/core/test/match-path.test.ts`. 5 blocks-test files updated to use `**` for descendant matches; same for ~10 MDX files in apps/storybook + apps/docs.

The unified spec also gains mid-string globs (`color.**.500`) for blocks consumers that didn't have them before.
