# Decisions

Append-only ADR-lite log. Entries capture tactical choices made during execution that don't warrant editing `plan.md` directly. Format:

```
## YYYY-MM-DD — <decision>
**Context:** …
**Decision:** …
**Rationale:** …
**Superseded by:** (link if later reversed)
```

---

## 2026-04-17 — Defer M5 (token-aware color control) until after M6

**Context:** M5's plan exit criterion is a \`swatchbook-color\` argType that writes \`var(--…)\` directly to the story's args via \`updateArgs\`. Storybook 10 has no first-class API for registering new control types in the Controls panel — the paths available are:
- Preset-colors on the built-in color picker (writes the raw color, not a var reference).
- Decorator-based picker above the story (not in the Args panel; works around `useArgs` quirks).
- Full custom Controls panel replacement (fights Storybook's panel ordering and is fragile across upstream updates).

**Decision:** Defer M5 to after M6. Reasons:
- M6's \`TokenDetail\` block and the Tokens panel we shipped in M4 already cover the "browse + pick a token" UX for authors.
- Investing build time in a custom control that the upstream may soon supersede is poor ROI now.
- Tracked as issue #68. M5 milestone stays open on GitHub; its two seed issues (#26, #27) closed as "not planned".

**Rationale:** The plan isn't a contract; deferring a milestone when the cost/benefit flips is the governance process working. M6 ships the higher-value surface.

---

## 2026-04-17 — Modernize `tsconfig.base.json` for TS 6

**Context:** TS 6 changed several defaults (`strict`, `module: esnext`, `target` = current-year floating, `noUncheckedSideEffectImports: true`, `libReplacement: false`) and added new strictness flags. Our base config was carrying TS 5-era boilerplate that's now redundant or outdated.

**Decision:** Trim the base to overrides-only. Additions beyond `strict`:

- `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature` — catch common correctness bugs.
- `allowUnreachableCode: false`, `allowUnusedLabels: false` — treat these as errors, not warnings.
- `erasableSyntaxOnly: true` — bans enums, namespaces, parameter properties, and `import =` / `export =`. Aligns with Node's `--experimental-strip-types` and our ESM-only stance.
- `moduleDetection: "force"` — every file is a module, no ambient-script mode.
- `lib` bumped to `ES2025` + added `DOM.AsyncIterable`.

Dropped (TS 6 handles by default): `strict`, `module`, `target`, `esModuleInterop`, `forceConsistentCasingInFileNames`.

**Rationale:** Less config to maintain, stricter correctness guardrails, future-proof against TS 7 where some of these (e.g. `erasableSyntaxOnly` being more strict) become the norm.

---

## 2026-04-17 — Internal aliasing via `package.json#imports` (with `#/` prefix)

**Context:** Deep relative paths (`../../../foo`) rot on moves, and TypeScript `paths` aliases require bundler cooperation + re-emit of paths at build time. Node 16+ supports package-scoped `imports` natively; TypeScript 5.4+ resolves them without a custom `paths` mapping. Node 24.14 relaxed the subpath grammar to accept a leading `#/`, which reads more naturally as a path than `#foo`.

**Decision:** Inside any package, internal aliases use the `imports` field in that package's `package.json`. Convention: `#/<slug>/*` → `./src/<slug>/*.js`. Never use TS `paths`, never use deep relative imports for cross-module references. Bump `engines.node` to `>=24.14.0` to guarantee the `#/` prefix resolves. Captured in `CLAUDE.md` → "Project conventions".

**Rationale:** One source of truth per package, works at runtime without build-time rewrites, plays nicely with tsdown/rolldown, visually distinct from npm-style bare specifiers.

**Side effect:** no alias configuration needed elsewhere. TypeScript (5.4+), Vite, and Vitest all read `package.json#imports` natively, so `tsconfig.json#paths`, `vite.config#resolve.alias`, and `vitest.config#resolve.alias` stay empty for internal aliasing. If you see one of those being added for an internal alias, delete it and use `imports`.

---

## 2026-04-17 — ESM-only everywhere, no CJS

**Context:** Greenfield repo targeting Node 24 LTS + modern bundlers. No downstream consumer we care about lacks ESM support. Shipping CJS would force dual-format builds and cost more than it saves.

**Decision:** Every package `"type": "module"`. Package builds emit ESM only (`tsdown --format esm`, no `--format cjs`). Captured in `CLAUDE.md` → "Project conventions".

**Rationale:** Cuts output size in half, avoids the dual-package hazard, keeps imports simple. If a consumer needs CJS, their bundler handles it.

---

## 2026-04-17 — Use tsdown instead of tsup for package builds

**Context:** tsup is no longer actively maintained; `tsdown` (same author lineage, rolldown-powered) is the recommended successor. tsup 8.5.1 also tripped TS 6's `baseUrl` deprecation during DTS emit, which required an `ignoreDeprecations` workaround.

**Decision:** All package builds use `tsdown`. Dropped `tsup` devDep, deleted `tsup.config.base.ts`, removed `"ignoreDeprecations": "6.0"` from `tsconfig.base.json` (tsdown doesn't trigger it). Output names are rolldown convention (`index.mjs`, `index.d.mts`) — `package.json` `main`/`types`/`exports` updated to match.

**Rationale:** Falls out of the "latest deps" policy. Kills the workaround.

**Supersedes:** The earlier same-day entry about `ignoreDeprecations` — no longer needed.

---

## 2026-04-17 — Bump GH Actions to latest majors (Node 24 runtimes)

**Context:** GitHub deprecated Node 20 runtimes for JavaScript actions (forced migration 2026-06-02, removal 2026-09-16). The v4 lineup we used on M0 scaffold was flagged at first CI run.

**Decision:** Pin the latest major of every action: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/cache@v5`, `actions/upload-artifact@v7`, `pnpm/action-setup@v5`. All use Node 24 natively.

**Rationale:** Falls out of the "latest deps" policy; no env-var workaround needed.

---

## 2026-04-17 — Latest deps policy + TS 6 + pnpm 10.33 + Node 24 minimum

**Context:** Repo starts with modern defaults; no legacy to carry. Prefer eager upgrades over drift.

**Decision:**
- Always pin the latest stable major/minor of every third-party dep unless a concrete blocker is logged here.
- Node baseline is the **latest LTS**, not a fixed version. Today that's Node 24 (active LTS). When a new LTS lands (roughly every October in even years), update `engines.node`, CI matrix, and this decisions entry in the same PR. Never add compat paths or CI entries for older Node.
- Immediate upgrades: `typescript` → `^6.0.0`, `turbo` → `^2.9.0`, `packageManager` → `pnpm@10.33.0`. CI matrix collapsed to `[24]`. Policy captured in `CLAUDE.md` → "Project conventions" so future sessions inherit it.

**Rationale:** Hitting version-change friction early is cheaper than deferred upgrades across a maturing codebase. No compatibility shims, no `>=` ranges wider than semver requires, no testing against Node versions we don't support.

---

## 2026-04-17 — Core's public helper is `defineSwatchbookConfig`, not `defineConfig`

**Context:** `@terrazzo/parser` exports its own `defineConfig`. Consumers of `@unpunnyfuns/swatchbook-core` often also import from `@terrazzo/parser` (advanced use cases), so colliding names would force aliasing at every import site.

**Decision:** Core's identity helper is exported as `defineSwatchbookConfig`. `plan.md` still refers to it as `defineConfig` informally — treat that as shorthand, not a contract.

**Rationale:** Clear imports outweigh brevity. Terrazzo is a required peer concept, not an implementation detail we hide.

---

## 2026-04-17 — Layered themes and Tokens Studio manifests are compiled into synthetic DTCG resolvers internally

**Context:** The Terrazzo spike showed `@terrazzo/parser` already has first-class DTCG 2025.10 resolver support (`createResolver`, `Resolver.apply`, `Resolver.listPermutations`). Writing our own merge/alias-resolution logic would duplicate it.

**Decision:** Swatchbook supports three *input* shapes (explicit layers, DTCG resolver, Tokens Studio manifest) but normalizes all of them to a single `ResolverSourceNormalized` before calling Terrazzo. Core's `themes/normalize.ts` is the only place with three branches; everything downstream (`resolveTheme`, `emitCss`, `emitTypes`) sees only a `Resolver`.

**Rationale:** One engine, three adapters. Shrinks core's scope and makes the three-way equivalence test trivial: it reduces to asserting identical `listPermutations()` output.

---

## 2026-04-17 — PR-based workflow from M1 onward

**Context:** M0 scaffold was committed directly to `main` to bootstrap the repo. From M1 onward we want the governance rules (plan diff alongside invalidating changes, PR template, decisions log) to have a clear mechanical enforcement point.

**Decision:** Every change after `076c970` flows through a PR. Branch names carry a milestone slug (`m1/…`, `docs/…`, `chore/…`). PRs squash-merge by default. Claude opens PRs, never self-merges — the human reviewer merges. Captured in `docs/plan.md` → "Plan governance" → "Branch & PR workflow".

**Rationale:** Makes "any PR that invalidates the plan must include the plan diff" a reviewable event, not an honor-system norm.

---

## 2026-04-17 — Pinned `storybook@10.3.5` and `@storybook/addon-mcp@0.6.0`

**Context:** Plan required Storybook 10.3+ for MCP support. Latest-stable check during M0 spike.

**Decision:** Apps and peer ranges pin `storybook@^10.3.5` and `@storybook/addon-vitest@^10.3.5`. The MCP addon is `@storybook/addon-mcp@^0.6.0`.

**Rationale:** Latest matching the plan's "MCP support requires 10.3" gate.

---

## 2026-04-17 — Iceboxed `@unpunnyfuns/swatchbook-tokens` starter past v0.1.0

**Context:** M8's original scope bundled three items: root README (#39), per-package READMEs (#38), and fleshing out `packages/tokens-starter` (#37) into a publishable slim pyramid with prebuilt CSS/JSON/types. The starter was positioned as a low-friction entry point — `pnpm add @unpunnyfuns/swatchbook-tokens` → import CSS → done.

**Decision:** Drop #37 from M8. The starter stays in the repo as a build-pipeline smoke test for core, but isn't a v0.1.0 release blocker. Issue #37 de-milestoned (kept open, unassigned).

**Rationale:** Consumers in the primary target audience (design-system teams) bring their own tokens — that's the whole point. The starter is "nice to have for tiny projects", not core value. Shipping it well means curating a defensible tasteful palette, which is effort that competes with getting the addon + blocks out the door. Revisit post-v0.1.0 once there's real signal for whether a starter is wanted at all.

**Plan impact:** `docs/plan.md` → M8 renamed from "Public starter + documentation" to "Public documentation". Starter work explicitly noted as deferred in the M8 body.

---

## 2026-04-17 — Rename root workspace package to `swatchbook`

**Context:** Root `package.json` was scaffolded as `swatchbook-monorepo` during M0 to keep the unscoped `swatchbook` name free for a potential published meta-package ("single-package face" of the addon set). Through M8 we've confirmed the public surface is the three scoped packages (`@unpunnyfuns/swatchbook-core` / `-addon` / `-blocks`); no meta-package is planned. The `-monorepo` suffix just adds noise.

**Decision:** Rename root `package.json#name` from `swatchbook-monorepo` to `swatchbook`. Stays `"private": true` — it's never published, just the workspace anchor. Matches the repo slug and the project's human identity.

**Rationale:** Private packages can use any name; `swatchbook` is the obvious one. Hedging for a hypothetical meta-package that we've actively decided against is dead weight.

**Plan impact:** `docs/plan.md` → "Workspace root" section updated; M0 work-bullet referencing the old name is historical and left as-is.
