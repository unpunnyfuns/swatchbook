# swatchbook-blocks

React MDX doc blocks for [swatchbook](https://github.com/unpunnyfuns/swatchbook).

Render your DTCG tokens in `.mdx` stories: swatch grids, type-specific previews, per-token inspectors. The blocks react to the toolbar's axis flips without any wiring in your story code.

Most consumers pick this up transitively via [`@unpunnyfuns/swatchbook-addon`](../addon); `import { TokenTable } from '@unpunnyfuns/swatchbook-addon'` works out of the box. Install this package directly when you want blocks _without_ the Storybook addon, such as unit tests or a standalone React app wrapping tokens in a custom surface.

## Install

```sh
npm install @unpunnyfuns/swatchbook-blocks
```

## Usage

Inside Storybook the addon mounts a `SwatchbookProvider` for you:

```mdx
import { ColorPalette, TokenTable, TokenDetail } from '@unpunnyfuns/swatchbook-addon';

<ColorPalette filter="color.**" />
<TokenTable filter="color.**" type="color" />
<TokenDetail path="color.accent.bg" />
```

Outside Storybook, wrap your tree in `SwatchbookProvider` and pass a wire snapshot (core's `snapshotForWire(project, css)`, typically written to JSON at build time):

```tsx
import { SwatchbookProvider, TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import wire from './tokens-snapshot.json';

<SwatchbookProvider snapshot={wire} defaultAxes={{ mode: 'Light' }}>
  <TokenTable filter="color.**" />
</SwatchbookProvider>;
```

Pass `defaultAxes` and flip the tuple with `useSetAxes()`, or pass `axes` to drive it from the host's own state.

Block catalogue, props, and composition patterns live in the [blocks reference](https://unpunnyfuns.github.io/swatchbook/reference/blocks) and the [authoring guide](https://unpunnyfuns.github.io/swatchbook/guides/authoring-doc-stories).

## Boundaries

Blocks read from `SwatchbookProvider`, not the addon's internal `virtual:swatchbook/tokens` module; don't import that directly. And `useGlobals` / `useArgs` from `storybook/preview-api` throw in a docs context, so don't call them inside custom blocks.

## Credits

Token parsing and resolver evaluation come from [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/): concepts, guides, and full API reference.
