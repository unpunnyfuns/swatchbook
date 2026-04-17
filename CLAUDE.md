# Swatchbook — Claude orientation

Storybook addon + doc blocks for DTCG design tokens. Monorepo under `@unpunnyfuns`.

## Start here

- Design doc: `docs/plan.md` — milestones M0–M9, package responsibilities, decisions locked in.
- Decision log: `docs/decisions.md` — append-only ADR-lite for changes made during execution.
- Terrazzo spike: `docs/terrazzo-notes.md` — what `@terrazzo/parser` gives us and what core still owns.

## Current milestone

`Current: M0 — Foundation`

Update this line when a milestone closes. See the matching GitHub milestones for per-issue state.

## Project conventions

- **Latest deps policy:** always pin the latest stable major/minor of every third-party dependency unless a concrete blocker is documented in `docs/decisions.md`. When adding a dep, check `npm view <pkg> version` and use that. Default to eager upgrades — we'd rather hit new-version friction early than accumulate a drift debt.
- **Node baseline:** always the **latest LTS** everywhere — dev, CI matrix, published `engines.node`. Today that's Node 24. When a new LTS lands (typically October of even years), bump engines + CI in a same-day PR. Don't add lower-version compat paths, polyfills, or matrix entries for older Node.
- **Package manager:** pnpm@10.33.0 (workspaces); orchestration via Turborepo.
- **Code style:** functional, avoid classes/singletons. No CSS-in-JS. No inline end-of-line comments.
- **Lint/format:** `oxlint` + `oxfmt`. Never `npx biome`.
- **Tests:** Vitest everywhere. Storybook Test (via `@storybook/addon-vitest`) for interaction tests in `apps/storybook`.
- **Design tokens:** ref → sys → cmp pyramid. Components never alias ref directly.
- **TypeScript:** strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` on.
- **READMEs:** module name + one-liner; structure table; TypeScript examples with imports; ✅/❌ for do's/don'ts.

## DTCG skill

`.claude/skills/dtcg-tokens/SKILL.md` — reference card for the DTCG 2025.10 spec. Loads automatically when working on token files; consult it before writing or editing `.tokens.json` / `.dtcg.json` content.

## Storybook MCP

`apps/storybook` runs an MCP server via `@storybook/addon-mcp` at `http://localhost:6006/mcp`. The MCP endpoint only exists while Storybook is running — start it in one terminal before using MCP tools in another.

```
# Terminal 1
pnpm dev           # = turbo run storybook
# Terminal 2
claude
```

## Plan governance

- Plan body edits → same PR as the change they reflect.
- Tactical choices that don't change design intent → append to `docs/decisions.md`.
- PR template (`.github/pull_request_template.md`) requires `Milestone:` and `Plan impact:` lines — don't remove them.
