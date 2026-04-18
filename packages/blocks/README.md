# @unpunnyfuns/swatchbook-blocks

Storybook MDX doc blocks for DTCG design tokens. React components for rendering token documentation inside `.mdx` pages or regular stories. Self-mount the addon's CSS and react to axis changes from the toolbar; work inside the docs container even though story decorators don't.

> **Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/). Token parsing powered by [Terrazzo](https://terrazzo.app/) by [Drew Powers](https://github.com/drwpow) via `@unpunnyfuns/swatchbook-core`.

## Install

```sh
pnpm add @unpunnyfuns/swatchbook-blocks
```

Requires `@unpunnyfuns/swatchbook-addon` to be registered in your Storybook config — the blocks consume its virtual token module.

## Blocks

| Block               | What                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `TokenTable`        | Searchable table of tokens, filterable by path glob and `$type`.                    |
| `ColorPalette`      | Swatch grid grouped by sub-path (`groupBy` controls depth).                         |
| `TypographyScale`   | Each typography composite token rendered as a sample line using its own value.      |
| `FontFamilySample`  | Pangram rendered per `fontFamily` primitive.                                        |
| `FontWeightScale`   | Same sample text rendered at each `fontWeight` primitive, sorted ascending.         |
| `StrokeStyleSample` | Border rendered per `strokeStyle` primitive.                                        |
| `TokenDetail`       | Single-token inspector — type, value, alias chain, aliased-by tree, per-axis variance, composite preview. |

Shared: every block accepts a `caption` override and renders against the addon's `var(--<prefix>-…)` output.

## MDX example

```mdx
import { TokenTable, ColorPalette, TokenDetail } from '@unpunnyfuns/swatchbook-blocks';

# Color tokens

<ColorPalette filter="color.sys.*" groupBy={3} />

## Every color token

<TokenTable filter="color.sys.*" type="color" />

## Inspect one

<TokenDetail path="color.sys.accent.bg" />
```

## Props

```ts
<TokenTable filter="color.sys.*" type="color" />
<ColorPalette filter="color.sys.*" groupBy={3} />
<TypographyScale filter="typography" sample="The quick brown fox" />
<TokenDetail path="color.sys.accent.bg" />
```

## Do / don't

- ✅ React to the active swatchbook theme — switching in the toolbar updates resolved values live, even on MDX docs pages.
- ✅ Compose multiple blocks per MDX page — each mounts independently.
- ❌ Don't run outside Storybook's preview/docs iframe — blocks rely on the addon's virtual token module.
- ❌ Don't use `useGlobals` / `useArgs` from `storybook/preview-api` inside custom blocks you write — those are story-only hooks and throw in docs context. Subscribe to `addons.getChannel()` directly for globals reactivity.

## See also

- [`@unpunnyfuns/swatchbook-addon`](../addon) — required peer. Registers the virtual module and the toolbar.
- [`@unpunnyfuns/swatchbook-core`](../core) — underlying loader.
- [Project README](../../README.md) — install and wiring flow for the whole toolchain.
- [Documentation](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
