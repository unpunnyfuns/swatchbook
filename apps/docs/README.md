# swatchbook docs

The swatchbook documentation site, built on [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/). It hosts the concepts, guides, and API reference published at [unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/).

Private workspace package. Not published.

## Develop

```sh
pnpm dev            # local dev server with live reload
pnpm build          # static build into ./dist
pnpm preview        # serve the built site
```

`prestart` / `prebuild` regenerate the dogfood tokens via `pnpm build:tokens` first.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) is the live site this package produces.
