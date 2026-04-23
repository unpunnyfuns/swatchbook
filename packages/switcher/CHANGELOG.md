# @unpunnyfuns/swatchbook-switcher

## 0.19.2

## 0.19.1

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.1

## 0.14.0

## 0.13.1

## 0.13.0

## 0.12.0

## 0.11.6

## 0.11.5

## 0.11.4

## 0.11.3

## 0.11.2

## 0.11.1

## 0.11.0

### Minor Changes

- da22d9e: feat(switcher, mcp): first npm publish

  Earlier releases listed these packages in the repo and docs, but they never reached the npm registry — `npm install @unpunnyfuns/swatchbook-switcher` and `npm install @unpunnyfuns/swatchbook-mcp` both 404'd because trusted publishing was configured for `core` / `addon` / `blocks` only, and the partial-publish failure caused `changesets/action` to skip the subsequent tag push too (which is why git tags stopped at 0.6.2).

  Bootstrapped via npm's pending-trusted-publisher flow on both package names. Subsequent releases publish alongside `core` / `addon` / `blocks` via the standard OIDC path, and the tag / GitHub-release step runs normally.

  This changeset also tips the fixed-version group to 0.11.0 — the arrival of these two packages on the registry is the right anchor for a minor bump.

## 0.10.2

## 0.10.1

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

### Minor Changes

- cecfdff: feat(switcher): extract theme-switcher popover into a standalone package

  Introduce `@unpunnyfuns/swatchbook-switcher`, a framework-agnostic
  React component that renders the axis / preset / color-format popover
  swatchbook's Storybook toolbar used to own inline. Consumers pass in
  `axes`, `presets`, `activeTuple`, and change callbacks; the component
  owns the pill UI + keyboard-accessible menu. Compiled with classic JSX
  (`React.createElement`) so it embeds cleanly in Storybook's manager
  bundle (which does not expose `react/jsx-runtime`).

  The addon's `AxesToolbar` now composes `<ThemeSwitcher>` inside its
  existing `WithTooltipPure` popover — no user-visible change; the same
  icon button, shortcuts, and behavior stay in place.

  Ships the switcher in the fixed-version group alongside core / addon /
  blocks so the four release together.
