# Contributing

Thanks for considering a contribution. Swatchbook is a Storybook addon for DTCG design tokens; everything user-facing lives under `packages/core`, `packages/addon`, `packages/blocks`, `packages/switcher`, and `packages/mcp`, with a dogfood Storybook in `apps/storybook` and the docs site in `apps/docs`.

By participating, you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Before you start

- Read the [quickstart](https://unpunnyfuns.github.io/swatchbook/quickstart) and poke the [live Storybook](https://unpunnyfuns.github.io/swatchbook/storybook/) so you know the shape of the project.
- **File an issue first** for anything non-trivial — a bug report, a feature sketch, a docs gap. Merging the eventual PR auto-closes it. Issues land under the **Maintenance** milestone by default; feature work goes to whatever scope milestone is active, if any.
- Question-shaped contributions (“how do I…”, “is X intentional?”) are better as [Discussions](https://github.com/unpunnyfuns/swatchbook/discussions) than issues.

## Dev setup

Requirements:

- **Node 24+** (latest LTS). We pin `engines.node` and test only against the current LTS.
- **pnpm 10.33.0+**. This is a pnpm-workspaces monorepo; npm / yarn won't work for development.

```sh
git clone https://github.com/unpunnyfuns/swatchbook
cd swatchbook
pnpm install
pnpm dev                     # = turbo run storybook — serves apps/storybook on :6006
```

The dogfood Storybook at `http://localhost:6006` runs the addon against `packages/tokens` — a multi-axis DTCG fixture. Every block you're changing renders there against real data.

## Running the checks

Before opening a PR, run:

```sh
pnpm -r format                            # oxfmt across every package
pnpm turbo run lint typecheck test        # oxlint + tsc --noEmit + vitest
```

Scope with `--filter=<pkg>` when something is slow:

```sh
pnpm turbo run test --filter=@unpunnyfuns/swatchbook-core
```

Storybook interaction tests run through `@storybook/addon-vitest`:

```sh
pnpm turbo run test:storybook
```

CI enforces all four. Don't skip locally — format regressions land as noisy follow-up commits, and CI fails on lint / typecheck / test regressions.

## Code style

- **Functional**. Avoid classes and singletons.
- **ESM only**. Every package is `"type": "module"`; no CJS builds, no dual-format outputs.
- **Explicit import extensions.** Relative and subpath imports both carry the on-disk extension: `.ts`, `.tsx`, `.css`, `.json`, whatever. The rule is *what you see is what's imported*.
- **Internal imports use `#/*`** (maps to `./src/*` per package). `import { emitCss } from '#/css.ts'` — not `../css` or `#/css`.
- **No CSS-in-JS.** Blocks use colocated `.css` files with `sb-<block>__<part>--<modifier>` BEM-ish class names; `clsx` at JSX sites when a class needs composition.
- **No inline end-of-line comments.** Comments sit on their own line above the code they describe.
- **oxlint + oxfmt** are the linter and formatter. Don't install Biome.

## Tests

[Vitest](https://vitest.dev/) everywhere. Tests live alongside or under `test/` directories.

Structure convention per [Avoid Nesting When You're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing):

- **Flat.** Each `it` reads top-to-bottom without scrolling up.
- **No nested `describe`.** One `describe` per file at most, as a file-level grouping. If you feel the urge to nest, split files instead.
- **No `beforeEach`** for cosmetic shared setup. Write an inline `setup()` helper and have each test call it. `beforeAll` is a performance escape hatch, not a grouping tool.
- **Prose test names over jargon.** `it('resolves alias chains (role → primitive)')` beats `it('resolves')` inside nested describes.

Storybook interaction tests (in `apps/storybook/src/stories/*.stories.tsx`) use the `play` function; keep them short and deterministic.

## Commits and PRs

### PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)

Format: `<type>(<scope>): <description>`.

**Types:** `feat` / `fix` / `chore` / `docs` / `test` / `ci` / `refactor` / `perf` / `build` / `revert`.

**Scopes:** one of `core`, `addon`, `blocks`, `switcher`, `mcp`, `tokens`, `storybook`, `docs`, `ci`, `a11y` — or omitted when a change spans multiple packages. `a11y` is the accessibility scope — use it for cross-cutting WCAG / axe / focus / contrast / keyboard-nav fixes that don't sit neatly inside one package.

**Subject:** imperative verb first, lowercase even for proper nouns. `feat(addon): rebind keyboard shortcut` — not `Feat(Addon): Rebinding the keyboard shortcut`.

Breaking changes: drop the `!` suffix. Breaking-ness is tracked in the changeset body, not the conventional-commits marker — we're pre-1.0 so breaking changes bump `minor`, not `major`.

### PR body

The template (`.github/pull_request_template.md`) requires three lines:

- **Milestone:** which milestone this belongs to.
- **Closes:** the linked issue, one per line (`Closes #42` — not a comma-separated list; GitHub only auto-closes the first item).
- **Plan impact:** `none` for most PRs; describe if the change reshapes a tracked plan.

Milestone goes in the body, never the title — squash-merge lands the title on `main` and you don't want the milestone tag in `git log`.

### Squash-merge

All PRs are squash-merged. One PR → one commit on `main`.

## Changesets

Any PR with a user-visible change to `@unpunnyfuns/swatchbook-core`, `@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks`, `@unpunnyfuns/swatchbook-switcher`, or `@unpunnyfuns/swatchbook-mcp` carries a changeset:

```sh
pnpm changeset
```

Pick a bump level and write a short description. All five published packages are a **fixed group** (always the same version), so the bump level you pick applies to every one of them.

**Bump levels, pre-1.0:**

- **`patch`** — bug fixes, docs-only PRs (the snapshot script rebuilds the current minor's docs on every release, so docs fixes need a release cycle to reach `/`).
- **`minor`** — new features *and* breaking changes. Pre-1.0, semver `0.x` treats minor as the "major-ish" position, so we bump minor rather than major for breakings until we cut 1.0.
- **`major`** — reserved for the 1.0 cut itself.

**Skip the changeset** for purely internal refactors (code style, test-only changes, CI, repo hygiene).

Publishing is automatic: Changesets opens a "Version Packages" PR that bumps versions + regenerates `CHANGELOG.md` and the docs snapshot. Merging that PR builds and publishes to npm via trusted publishing (OIDC; no token secrets).

## Issues and labels

- **`future`** — iceboxed / not scheduled. Revisit when a trigger in the issue body fires.
- **`bug`**, **`enhancement`**, **`documentation`** — GitHub defaults, used sparingly.
- Issues under the **Future Considerations** milestone plus the `future` label = "we've thought about it, intentionally deferring."

Don't file duplicates — search closed issues first. If you find a stale one that's come back around, reopen with a comment rather than filing a new one.

## Licensing

Swatchbook is MIT. By contributing, you agree your contribution is licensed the same way. No CLA.

## Thanks

If you got this far, you're already doing more work than most. Ping @unpunnyfuns on the PR if something in this doc didn't match reality — it's a living file.
