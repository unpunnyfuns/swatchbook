# @unpunnyfuns/swatchbook-switcher

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
