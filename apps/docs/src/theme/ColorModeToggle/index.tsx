import React from 'react';
import { SwatchbookSwitcherButton } from '../../components/SwatchbookSwitcherButton';

/**
 * ColorModeToggle swizzle (full replacement) — Docusaurus reserves a
 * navbar slot for the colour-mode toggle. Replacing the component keeps
 * the slot and lets the swatchbook switcher inherit its placement
 * instead of adding a separate navbar item. Mode (Light / Dark) is
 * still reachable as an axis inside the switcher popover; the provider
 * bridges it to Docusaurus's `useColorMode` so `[data-theme]` on
 * `<html>` stays in lockstep.
 */
export default function ColorModeToggle(): React.ReactElement {
  return <SwatchbookSwitcherButton />;
}
