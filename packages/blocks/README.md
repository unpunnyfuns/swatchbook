# @unpunnyfuns/swatchbook-blocks

Storybook MDX doc blocks for DTCG design tokens. Drop-in React components for rendering token documentation inside `.mdx` pages or standard React stories.

## Install

```sh
pnpm add @unpunnyfuns/swatchbook-blocks
```

Requires `@unpunnyfuns/swatchbook-addon` to be registered in your Storybook config — the blocks consume its virtual token module and theme context.

## Blocks

| Block              | What                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `TokenTable`       | Columnar listing of tokens, filterable by path glob and `$type`. |
| `ColorPalette`     | Swatch grid grouped by sub-path, optionally scoped to a group.   |
| `TypographyScale`  | Each typography token rendered as a sample line using its value. |
| `TokenDetail`      | Full per-token detail — type, description, per-theme values.     |

## MDX example

```mdx
import { TokenTable, ColorPalette } from '@unpunnyfuns/swatchbook-blocks';

# Color tokens

<ColorPalette group="color.sys" />

## Every color token

<TokenTable type="color" />
```

✅ Blocks react to the active swatchbook theme — switching in the toolbar updates resolved values live.
❌ Blocks can't run outside Storybook's preview/docs iframe — they rely on the addon's virtual token module.
