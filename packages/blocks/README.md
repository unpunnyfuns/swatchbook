# swatchbook-blocks

React MDX doc blocks for [swatchbook](https://github.com/unpunnyfuns/swatchbook).

Render your DTCG tokens in `.mdx` stories — swatch grids, type-specific previews, per-token inspectors. The blocks react to the toolbar's axis flips without any wiring in your story code.

Most consumers pick this up transitively via [`@unpunnyfuns/swatchbook-addon`](../addon); `import { TokenTable } from '@unpunnyfuns/swatchbook-addon'` works out of the box. Install this package directly when you want blocks *without* the Storybook addon — unit tests, a standalone React app wrapping tokens in a custom surface.

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

Outside Storybook, wrap your tree in `SwatchbookProvider` and pass a `ProjectSnapshot`:

```tsx
import { SwatchbookProvider, TokenTable } from '@unpunnyfuns/swatchbook-blocks';
import snapshot from './tokens-snapshot.json';

<SwatchbookProvider value={snapshot}>
  <TokenTable filter='color.*' />
</SwatchbookProvider>
```

Block catalogue, props, and composition patterns live in the [blocks reference](https://unpunnyfuns.github.io/swatchbook/reference/blocks) and the [authoring guide](https://unpunnyfuns.github.io/swatchbook/guides/authoring-doc-stories).

## Boundaries

- ✅ Compose multiple blocks per page — each mounts independently.
- ✅ Render outside Storybook with a hand-built or loaded `ProjectSnapshot`.
- ❌ Don't import from `virtual:swatchbook/tokens` — it's the addon's internal wiring, not a public API. Use `SwatchbookProvider`.
- ❌ Don't use `useGlobals` / `useArgs` from `storybook/preview-api` inside custom blocks — those hooks throw in docs context.

## Credits

Token parsing and resolver evaluation come from [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp) via `@unpunnyfuns/swatchbook-core`.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
