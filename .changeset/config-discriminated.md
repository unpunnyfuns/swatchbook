---
"@unpunnyfuns/swatchbook-core": minor
---

Closes #865. Discriminates `Config` into three variants — `ResolverConfig`, `LayeredConfig`, `PlainConfig` — so the loader's three-arm `tokens`/`resolver`/`axes` switch is compile-checked instead of only runtime-checked.

**Shape:**
```ts
type Config = ResolverConfig | LayeredConfig | PlainConfig;

interface ResolverConfig extends CommonConfig {
  resolver: string;
  tokens?: string[];
  axes?: never;
}

interface LayeredConfig extends CommonConfig {
  axes: AxisConfig[];
  tokens: string[];
  resolver?: never;
}

interface PlainConfig extends CommonConfig {
  tokens: string[];
  axes?: never;
  resolver?: never;
}
```

**What this catches at compile time:**
- `{ resolver: 'x.json', axes: [...] }` — mutually-exclusive trio violated. Today this is a runtime throw (`'either `resolver` or `axes`, not both'`); now it's a TS error.
- `{ axes: [...] }` without `tokens` — LayeredConfig requires the base layer. Today this is a runtime throw; now it's a TS error.

**What this preserves:**
- **Zero call-site churn.** The shape uses field-presence narrowing (`?: never` on the other variants' fields) rather than an explicit `mode` discriminant — so every existing config like `{ resolver: 'tokens/resolver.json' }` still type-checks unchanged. The audit suggested an explicit `mode: 'resolver' | 'layered' | 'plain'` discriminant, but that adds redundant ceremony to every config-construction site (the presence of `resolver` already tells you the mode); field-presence narrowing gets the same compile-time safety without the noise.
- **Runtime checks intact.** The loader's existing `if (config.resolver && config.axes)` and `if (!config.tokens)` throws still run — defense-in-depth for JS callers bypassing the type system.

**Consumer-side wins:**
- `loadProject`, `defineSwatchbookConfig`, addon's `swatchbookTokensPlugin`, MCP's `loadFromConfig`, and integrations now have type-narrowed `Config` consumers — invalid shapes can't be constructed in TypeScript.
- Three new named subtypes (`ResolverConfig`, `LayeredConfig`, `PlainConfig`) export from core for consumers that want explicit annotation (`const cfg: ResolverConfig = …`).

The existing gating-test fixtures in `packages/core/test/permutations-normalize-gating.test.ts` add `@ts-expect-error` comments documenting that their constructions are deliberately invalid at the type level.

Pre-1.0 minor bump per project semver. The Worth-a-PR tier of the audit's punch list is now complete (#824 / #831 / #833 / #865 / #866 / ~~#822~~).
