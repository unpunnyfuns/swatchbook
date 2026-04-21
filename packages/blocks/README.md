# swatchbook-blocks

Published as `@unpunnyfuns/swatchbook-blocks`. Storybook MDX doc blocks for DTCG design tokens. React components for rendering token documentation inside `.mdx` pages or regular stories. Self-mount the addon's CSS and react to axis changes from the toolbar; work inside the docs container even though story decorators don't.

> **Documentation:** [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/). Token parsing powered by [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Install

Most consumers pick this up transitively via `@unpunnyfuns/swatchbook-addon` — the addon re-exports the full blocks API, so `import { TokenTable } from '@unpunnyfuns/swatchbook-addon'` works and you don't need a second install line. Reach for this package directly when you want blocks *without* the Storybook addon (unit tests, a standalone React app wrapping tokens in a custom surface):

```sh
npm install @unpunnyfuns/swatchbook-blocks
```

Blocks read the token graph from a `SwatchbookProvider`. Inside Storybook, the addon's preview decorator mounts the provider automatically. Outside Storybook, wrap your tree in `SwatchbookProvider` and pass a `ProjectSnapshot` directly (see [Outside Storybook](#outside-storybook) below).

## Blocks

| Block               | What                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `TokenTable`        | Searchable table of tokens, filterable by path glob and `$type`.                    |
| `TokenNavigator`    | Expandable tree view of the token graph keyed on dot-path segments, with inline per-type previews. |
| `ColorPalette`      | Swatch grid grouped by sub-path. Auto-groups from the filter; `groupBy` overrides.  |
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
import { TokenTable, ColorPalette, TokenDetail } from '@unpunnyfuns/swatchbook-addon';

# Color tokens

<ColorPalette filter="color.*" />

## Every color token

<TokenTable filter="color.*" type="color" />

## Inspect one

<TokenDetail path="color.accent.bg" />
```

### Outside Storybook

Blocks are pure presentation — given a `ProjectSnapshot` they render without any Storybook or Vite plugin. Mount a `SwatchbookProvider` at the top of your tree:

```tsx
import { SwatchbookProvider, TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import snapshot from './tokens-snapshot.json';

export function TokenDocs() {
  return (
    <SwatchbookProvider value={snapshot}>
      <TokenTable filter='color.*' />
    </SwatchbookProvider>
  );
}
```

`SwatchbookProvider` is the canonical integration point. The `virtual:swatchbook/tokens` module is the Storybook addon's internal wiring, not a public API.

## Props

```ts
<TokenTable filter="color.*" type="color" />
<ColorPalette filter="color.*" />
<TypographyScale filter="typography" sample="The quick brown fox" />
<TokenDetail path="color.accent.bg" />
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
