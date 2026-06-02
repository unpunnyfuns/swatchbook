# swatchbook storybook

The reference Storybook for swatchbook. It exercises the addon and doc blocks against the repo's own [`@unpunnyfuns/swatchbook-tokens`](../../packages/tokens) dogfood token set, doubling as a manual proving ground and the source for the published reference build.

Private workspace package. Not published.

## Run

```sh
pnpm storybook          # dev server on :6006
pnpm test:storybook     # story-level interaction tests via Vitest
```

From the repo root, `pnpm dev` runs this through Turborepo.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) hosts the concepts, guides, and full API reference. The published reference build lives at [/storybook](https://unpunnyfuns.github.io/swatchbook/storybook/).
