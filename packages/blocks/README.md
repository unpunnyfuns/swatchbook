# Blocks

Published as `@unpunnyfuns/swatchbook-blocks`. Storybook MDX doc blocks for DTCG design tokens. React components for rendering token documentation inside `.mdx` pages or regular stories. Self-mount the addon's CSS and react to axis changes from the toolbar; work inside the docs container even though story decorators don't.

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
| `GradientPalette`   | Wide swatch per `gradient` token with stop breakdown (linear-gradient default).      |
| `MotionSample`      | Animated ball + track for one `transition` / `duration` / `cubicBezier` token. Accepts `speed` / `runKey`. |
| `ShadowSample`      | Surface rectangle with one `shadow` token applied as `box-shadow`.                  |
| `BorderSample`      | Surface rectangle with one `border` token applied as `border`.                      |
| `DimensionBar`      | Width-driven bar (or square / radius sample, via `kind`) for one `dimension` token. |
| `TokenDetail`       | Single-token inspector — composition of the subcomponents below. |
| `TokenHeader`       | Heading + `$type` pill + cssVar + `$description`, or a missing-token empty state. |
| `CompositePreview`  | Type-dispatched live preview (typography, shadow, border, transition, dimension, duration, cubicBezier, fontFamily, fontWeight, strokeStyle, gradient, color). |
| `CompositeBreakdown`| Labelled sub-value grid for composite types (typography / border / transition / shadow / gradient). |
| `AliasChain`        | Forward alias chain (`path → alias → …`). Renders nothing for non-aliases. |
| `AliasedBy`         | Aliased-by tree (backward). Truncates at depth 6. |
| `AxisVariance`      | Per-axis value table — constant, one-axis, or two-axis matrix view. |
| `TokenUsageSnippet` | Copy-ready `color: var(--…);` snippet. |

Shared: every block accepts a `caption` override and renders against the addon's `var(--<prefix>-…)` output.

## Usage

### Inside Storybook

The addon's preview decorator wraps every story in a `SwatchbookProvider` for you, so MDX and story authors drop blocks in directly:

```mdx
import { TokenTable, ColorPalette, TokenDetail } from '@unpunnyfuns/swatchbook-blocks';

# Color tokens

<ColorPalette filter="color.sys.*" groupBy={3} />

## Every color token

<TokenTable filter="color.sys.*" type="color" />

## Inspect one

<TokenDetail path="color.sys.accent.bg" />
```

### Outside Storybook

Blocks are pure presentation — given a `ProjectSnapshot` they render without any Storybook or Vite plugin. Mount a `SwatchbookProvider` at the top of your tree:

```tsx
import { SwatchbookProvider, TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import snapshot from './tokens-snapshot.json';

export function TokenDocs() {
  return (
    <SwatchbookProvider value={snapshot}>
      <TokenTable filter='color.sys.*' />
    </SwatchbookProvider>
  );
}
```

`SwatchbookProvider` is the canonical integration point. The `virtual:swatchbook/tokens` module is the Storybook addon's internal wiring, not a public API.

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
- ✅ Render blocks outside Storybook by wrapping them in `SwatchbookProvider` with a hand-built or loaded `ProjectSnapshot`.
- ❌ Don't import from `virtual:swatchbook/tokens` directly — it's the addon's internal wiring, not a public API. Use `SwatchbookProvider` instead.
- ❌ Don't use `useGlobals` / `useArgs` from `storybook/preview-api` inside custom blocks you write — those are story-only hooks and throw in docs context. Subscribe to `addons.getChannel()` directly for globals reactivity.

## See also

- [`@unpunnyfuns/swatchbook-addon`](../addon) — required peer. Registers the virtual module and the toolbar.
- [`@unpunnyfuns/swatchbook-core`](../core) — underlying loader.
- [Project README](../../README.md) — install and wiring flow for the whole toolchain.
- [Documentation](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
