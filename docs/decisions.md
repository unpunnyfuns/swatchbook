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

## 2026-04-17 — Pinned `storybook@10.3.5` and `@storybook/addon-mcp@0.6.0`

**Context:** Plan required Storybook 10.3+ for MCP support. Latest-stable check during M0 spike.

**Decision:** Apps and peer ranges pin `storybook@^10.3.5` and `@storybook/addon-vitest@^10.3.5`. The MCP addon is `@storybook/addon-mcp@^0.6.0`.

**Rationale:** Latest matching the plan's "MCP support requires 10.3" gate.
