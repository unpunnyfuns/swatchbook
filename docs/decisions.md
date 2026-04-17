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

## 2026-04-17 — `ignoreDeprecations: "6.0"` in base tsconfig

**Context:** TS 6 deprecated implicit `baseUrl`. tsup 8.5.1 (our build tool) still injects `baseUrl` internally during the DTS pass, which surfaces TS5101 and fails the build.

**Decision:** Add `"ignoreDeprecations": "6.0"` to `tsconfig.base.json`. Revisit when tsup lands a fix (or when we switch to the TS 7 release cycle — the option becomes a hard error then).

**Rationale:** Smallest possible workaround. Keeps us on latest TS without forking tsup.

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
