# swatchbook-tokens

The reference DTCG fixture for [swatchbook](https://github.com/unpunnyfuns/swatchbook).

An exhaustive DTCG 2025.10 token project — palette primitives, semantic roles, typography composites, motion, shadow, border, gradient, stroke — used as swatchbook's own internal test bed and as a worked example for projects structuring their own token trees.

Private workspace package. Not published.

## Composition

`tokens/resolver.json` is a DTCG 2025.10 native resolver (`sets` + `modifiers` + `resolutionOrder`). Three independent modifiers compose into named themes: every combination of `mode` (Light/Dark), `brand` (Default/Brand A), and `contrast` (Normal/High).

## Consumption

```ts
import { tokensDir, resolverPath } from '@unpunnyfuns/swatchbook-tokens';
```

- ✅ Use the exported path helpers — `import.meta`-resolved, survives `node_modules` hoisting.
- ❌ Don't hard-code `node_modules/@unpunnyfuns/swatchbook-tokens/tokens/...` paths.
